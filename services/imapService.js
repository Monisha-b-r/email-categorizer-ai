// services/imapService.js
import { ImapFlow } from "imapflow";

export async function fetchEmails(account) {
  const client = new ImapFlow({
    host: account.host,
    port: account.port,
    secure: true,
    auth: { user: account.user, pass: account.pass }
  });

  await client.connect();
  await client.mailboxOpen("INBOX");

  let emails = [];
  for await (let msg of client.fetch("1:*", { envelope: true })) {
    emails.push({
      subject: msg.envelope.subject,
      from: msg.envelope.from[0].address,
      date: msg.envelope.date
    });
  }

  await client.logout();
  return emails;
}
