import { simpleParser } from "mailparser";
import { ImapFlow } from "imapflow";
import { indexEmail } from "../config/elastic.js";
import { notifySlack, sendWebhook } from "./notifyService.js";
import Email from "../models/Email.js";

export async function startImapListeners() {
  const accounts = [
    {
      user: process.env.EMAIL1,
      pass: process.env.PASS1,
      host: "imap.gmail.com",
      port: 993,
    },
  ];

  for (const acc of accounts) {
    const client = new ImapFlow({
      host: acc.host,
      port: acc.port,
      secure: true,
      auth: { user: acc.user, pass: acc.pass },
    });

    client.on("error", (err) =>
      console.error(`❌ IMAP Error [${acc.user}]:`, err.message)
    );
    client.on("close", () => console.log(`📴 IMAP closed for ${acc.user}`));

    await client.connect();
    await client.mailboxOpen("INBOX");

    console.log(`📡 Connected to IMAP for ${acc.user}`);

    // 🧠 1. Initial 30-day fetch
    const since = new Date();
    since.setDate(since.getDate() - 30);

    for await (let msg of client.fetch(
      { since },
      { envelope: true, source: true }
    )) {
      await handleEmail(msg, acc.user);
    }

    console.log(`✅ Initial fetch done for ${acc.user}`);

    // 🕒 2. Real-time listener (IDLE mode)
    client.on("exists", async () => {
      console.log(`📩 New email detected for ${acc.user}`);

      const lock = await client.getMailboxLock("INBOX");
      try {
        const status = await client.status("INBOX", { messages: true });
        const lastUid = status.messages;

        for await (const msg of client.fetch(lastUid + ":*", {
          envelope: true,
          source: true,
        })) {
          await handleEmail(msg, acc.user);
        }
      } finally {
        lock.release();
      }
    });
  }
}

// 🧠 Universal handler for both initial + real-time messages
async function handleEmail(msg, accountUser) {
  try {
    const subject = msg.envelope.subject || "(No Subject)";
    const from = msg.envelope.from?.[0]?.address || "Unknown";

    // Ensure full email source is read before parsing
    const source = await msg.source;
    const parsed = await simpleParser(source);

    // 🧠 1. Choose the best body version (HTML > textAsHtml > text)
    let body = "";
    if (parsed.html && parsed.html.trim().length > 0) {
      body = parsed.html;
    } else if (parsed.textAsHtml && parsed.textAsHtml.trim().length > 0) {
      body = parsed.textAsHtml;
    } else if (parsed.text && parsed.text.trim().length > 0) {
      body = `<pre>${parsed.text}</pre>`;
    } else {
      body =
        "<p class='text-gray-500 italic'>🖼️ This email contains only images or attachments that can’t be displayed here.</p>";
    }

    // 🧹 2. Clean common noisy headers / junk lines
    body = body
      .replace(/Delivered-To:.*?\n/g, "")
      .replace(/Return-Path:.*?\n/g, "")
      .replace(/Received:.*?\n/g, "")
      .replace(/ARC-.*/g, "")
      .replace(/X-.*/g, "")
      .replace(/Authentication-Results:.*/g, "")
      .replace(/Content-Type:.*/g, "")
      .replace(/boundary=.*/g, "")
      .replace(/charset=.*/g, "")
      .trim();

    // 🖼️ 3. Handle image-only emails (Nykaa, Glassdoor)
    // If body has only <img> or <style> tags, add fallback text
    const isImageOnly = /^<img|^<style|<head>/i.test(body) && body.length < 200;
    if (isImageOnly) {
      body =
        "<p class='text-gray-500 italic'>🖼️ This email contains only images or marketing content that can’t be displayed here.</p>";
    }

    // 🪄 4. Categorize
    const category = categorizeEmail(subject, body);

    // 🕒 5. Construct email object
    const emailDoc = {
      subject,
      from,
      body: body.slice(0, 25000), // limit long HTML safely
      category,
      account: accountUser,
      createdAt: new Date(),
    };

    // ✅ 6. Prevent duplicates
    const exists = await Email.findOne({ subject, from });
    if (!exists) {
      await Email.create(emailDoc);
      console.log(`✅ Saved cleaned email: ${subject}`);
    }

    // 🔄 Optional: Sync with Elastic & Slack/Webhook
    await indexEmail(emailDoc);
    await notifySlack(emailDoc);
    await sendWebhook(emailDoc);
  } catch (err) {
    console.error("❌ Error handling email:", err.message);
  }
}

// 🧠 Categorization logic
function categorizeEmail(subject, body) {
  const text = (subject + " " + body).toLowerCase();

  if (
    text.includes("sale") ||
    text.includes("offer") ||
    text.includes("discount") ||
    text.includes("coupon") ||
    text.includes("webinar") ||
    text.includes("deal")
  )
    return "Promotions";

  if (
    text.includes("update") ||
    text.includes("newsletter") ||
    text.includes("application") ||
    text.includes("announcement")
  )
    return "Updates";

  if (
    text.includes("unsubscribe") ||
    text.includes("spam") ||
    text.includes("lottery") ||
    text.includes("winner")
  )
    return "Spam";

  if (
    text.includes("hi") ||
    text.includes("hello") ||
    text.includes("meeting") ||
    text.includes("regards") ||
    text.includes("discussion") ||
    text.includes("reply")
  )
    return "Primary";

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

  for await (let msg of client.fetch("1:*", { envelope: true, source: true })) {
    await handleEmail(msg, account.user);
  }

  await client.logout();
  return emails;
}
