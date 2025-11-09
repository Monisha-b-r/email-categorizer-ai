import express from "express";
import { fetchEmails } from "../services/imapService.js";
import { notifySlack } from "../services/slackService.js";
import { indexEmail } from "../config/elastic.js";
 // simulate Slack

const router = express.Router();

router.get("/emails", async (req, res) => {
  try {
    const account1 = { user: process.env.EMAIL1, pass: process.env.PASS1, host: "imap.gmail.com", port: 993 };
    const account2 = { user: process.env.EMAIL2, pass: process.env.PASS2, host: "imap.gmail.com", port: 993 };

    const emails1 = await fetchEmails(account1);
    const emails2 = await fetchEmails(account2);

    const allEmails = [...emails1, ...emails2];

    // Simulate AI categorization & Slack notification
    for (const email of allEmails) {
  // Simple AI categorization
  email.category = email.subject.includes("Meeting") ? "Interested" : "Not Interested";

  // Notify Slack (mock)
  await notifySlack(email);

  // 🧠 Index email into Elasticsearch
  await indexEmail({
    subject: email.subject,
    from: email.from,
    to: email.to,
    body: email.body,
    category: email.category,
    createdAt: new Date()
  });
}
    res.json({ emails: allEmails });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
