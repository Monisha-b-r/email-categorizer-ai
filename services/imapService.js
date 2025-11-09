// services/imapService.js
import { ImapFlow } from "imapflow";
import { indexEmail } from "../config/elastic.js";
import { notifySlack, sendWebhook } from "./notifyService.js";

export async function startImapListeners() {
  const accounts = [
    {
      user: process.env.EMAIL1,
      pass: process.env.PASS1,
      host: "imap.gmail.com",
      port: 993,
    },
    // {
    //   user: process.env.EMAIL2,
    //   pass: process.env.PASS2,
    //   host: "imap.gmail.com",
    //   port: 993,
    // },
  ];

  for (const acc of accounts) {
    const client = new ImapFlow({
      host: acc.host,
      port: acc.port,
      secure: true,
      auth: { user: acc.user, pass: acc.pass },
    });

    client.on("error", (err) => console.error(`❌ IMAP Error [${acc.user}]:`, err.message));
    client.on("close", () => console.log(`📴 IMAP closed for ${acc.user}`));

    await client.connect();
    await client.mailboxOpen("INBOX");

    console.log(`📡 Connected to IMAP for ${acc.user}`);

    // 🧠 1. Initial 30-day fetch
    const since = new Date();
    since.setDate(since.getDate() - 30);

    for await (let msg of client.fetch({ since }, { envelope: true, source: true })) {
      const subject = msg.envelope.subject || "(No Subject)";
      const from = msg.envelope.from?.[0]?.address || "Unknown";
      const body = msg.source.toString().slice(0, 500);

      const category = categorizeEmail(subject, body);

      await indexEmail({ subject, body, category, account: acc.user, createdAt: new Date() });
    }

    console.log(`✅ Initial fetch done for ${acc.user}`);

    // 🕒 2. Real-time listener (IDLE mode)
    client.on("exists", async () => {
      console.log(`📩 New email detected for ${acc.user}`);

      // Fetch the latest message
      const lock = await client.getMailboxLock("INBOX");
      try {
        const status = await client.status("INBOX", { messages: true });
        const lastUid = status.messages;

        for await (const msg of client.fetch(lastUid + ":*", { envelope: true, source: true })) {
          const subject = msg.envelope.subject || "(No Subject)";
          const from = msg.envelope.from?.[0]?.address || "Unknown";
          const body = msg.source.toString().slice(0, 500);
          const category = categorizeEmail(subject, body);

          console.log(`💌 New Email: ${subject}`);

          await indexEmail({ subject, body, category, account: acc.user, createdAt: new Date() });
          await notifySlack({ subject, body, category });
          await sendWebhook({ subject, body, category });
        }
      } finally {
        lock.release();
      }
    });
  }
}

// 🧠 Simple categorization (reuse logic)
function categorizeEmail(subject, body) {
  const text = (subject + " " + body).toLowerCase();

  if (text.includes("meeting") || text.includes("schedule") || text.includes("call"))
    return "Meeting Booked";
  if (text.includes("interested") || text.includes("let's connect"))
    return "Interested";
  if (text.includes("not interested") || text.includes("decline"))
    return "Not Interested";
  if (text.includes("out of office") || text.includes("ooo"))
    return "Out of Office";
  if (text.includes("unsubscribe") || text.includes("spam"))
    return "Spam";

  return "General";
}

export async function fetchEmails(account) {
  const client = new ImapFlow({
    host: account.host,
    port: account.port,
    secure: true,
    auth: { user: account.user, pass: account.pass },
  });

  await client.connect();
  await client.mailboxOpen("INBOX");

  const emails = [];

  for await (let msg of client.fetch("1:*", { envelope: true })) {
    emails.push({
      subject: msg.envelope.subject || "(No Subject)",
      from: msg.envelope.from?.[0]?.address || "Unknown",
      date: msg.envelope.date || new Date(),
    });
  }

  await client.logout();
  return emails;
}
