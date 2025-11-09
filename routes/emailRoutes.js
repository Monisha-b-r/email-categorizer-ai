// routes/emailRoutes.js
import express from "express";
import { fetchEmails } from "../services/imapService.js";
import { notifySlack } from "../services/slackService.js";
import { indexEmail } from "../config/elastic.js";
import { fetchRecentEmails } from "../services/gmailSync.js";

const router = express.Router();

/* -------------------- TEST ROUTE -------------------- */
/* Manually index one test email via your backend */
router.post("/test-index", async (req, res) => {
  try {
    const { subject, body, category } = req.body || {};
    const doc = {
      subject: subject || "Test subject from app",
      body: body || "Test body",
      category: category || "Interested",
      account: req.body?.account || "test-account",
      folder: req.body?.folder || "INBOX",
      createdAt: new Date(),
    };

    console.log("🔁 test-index: indexing doc:", doc.subject);
    await indexEmail(doc); // actually push to Elasticsearch
    return res.json({ ok: true, message: "✅ Indexed successfully!", doc });
  } catch (err) {
    console.error("❌ test-index error:", err);
    return res.status(500).json({ error: err.message || err });
  }
});
router.get("/sync-gmail", async (req, res) => {
  try {
    await fetchRecentEmails();
    res.json({ message: "✅ Gmail sync completed!" });
  } catch (err) {
    console.error("❌ Gmail sync error:", err);
    res.status(500).json({ error: err.message });
  }
});
/* -------------------- EMAIL FETCH ROUTE -------------------- */
/* Fetch emails via IMAP, categorize, notify Slack (mock), and index */
router.get("/emails", async (req, res) => {
  try {
    const account1 = {
      user: process.env.EMAIL1,
      pass: process.env.PASS1,
      host: "imap.gmail.com",
      port: 993,
    };
    const account2 = {
      user: process.env.EMAIL2,
      pass: process.env.PASS2,
      host: "imap.gmail.com",
      port: 993,
    };

    const emails1 = await fetchEmails(account1);
    const emails2 = await fetchEmails(account2);
    const allEmails = [...emails1, ...emails2];

    for (const email of allEmails) {
      // Simple AI categorization
      email.category = email.subject.includes("Meeting")
        ? "Meeting Booked"
        : email.subject.includes("Interested")
        ? "Interested"
        : "Not Interested";

      // Notify Slack (mock)
      await notifySlack(email);

      // Index into Elasticsearch
      await indexEmail({
        subject: email.subject,
        from: email.from,
        to: email.to,
        body: email.body,
        category: email.category,
        createdAt: new Date(),
      });
    }

    res.json({ message: "✅ Emails processed & indexed", emails: allEmails });
  } catch (err) {
    console.error("❌ Error fetching emails:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
