// config/imapClient.js
import Imap from "imap";
import { simpleParser } from "simple-parser";
import { saveEmail } from "../controllers/emailController.js"; // we’ll create this later

const imapConfig = {
  user: process.env.EMAIL_USER, // your email ID
  password: process.env.EMAIL_PASS, // your app password
  host: "imap.gmail.com", // Gmail IMAP server
  port: 993,
  tls: true
};

export function startEmailListener() {
  const imap = new Imap(imapConfig);

  imap.once("ready", () => {
    console.log("📩 IMAP connected. Listening for new emails...");

    imap.openBox("INBOX", false, () => {
      imap.on("mail", () => {
        fetchNewEmails(imap);
      });
    });
  });

  imap.once("error", (err) => {
    console.error("❌ IMAP error:", err);
  });

  imap.connect();
}

function fetchNewEmails(imap) {
  imap.search(["UNSEEN"], (err, results) => {
    if (err || !results.length) return;

    const fetcher = imap.fetch(results, { bodies: "" });
    fetcher.on("message", (msg) => {
      msg.on("body", (stream) => {
        simpleParser(stream, async (err, mail) => {
          if (err) return console.error("❌ Parse error:", err);

          const newEmail = {
            from: mail.from.text,
            subject: mail.subject,
            body: mail.text,
          };

          // save to DB + Elasticsearch
          await saveEmail(newEmail);

          console.log(`✅ New Email Saved: ${mail.subject}`);
        });
      });
    });
  });
}
