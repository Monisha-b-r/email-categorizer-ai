import express from "express";
import { fetchEmails } from "../services/imapService.js";
import { notifySlack } from "../services/slackService.js";
import { indexEmail } from "../config/elastic.js";
import { fetchRecentEmails } from "../services/gmailSync.js";
import Email from "../models/Email.js";

const router = express.Router();

/* -------------------- TEST ROUTE -------------------- */
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
    await indexEmail(doc);
    await Email.create(doc); // also save to MongoDB
    return res.json({ ok: true, message: "✅ Indexed successfully!", doc });
  } catch (err) {
    console.error("❌ test-index error:", err);
    return res.status(500).json({ error: err.message || err });
  }
});

/* -------------------- GMAIL SYNC -------------------- */
router.get("/sync-gmail", async (req, res) => {
  try {
    await fetchRecentEmails();
    res.json({ message: "✅ Gmail sync completed!" });
  } catch (err) {
    console.error("❌ Gmail sync error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- EMAIL FETCH -------------------- */
router.get("/emails", async (req, res) => {
  try {
    // fetch latest 50 emails from DB
    const emails = await Email.find().sort({ createdAt: -1 }).limit(50);
    res.json({ emails });
  } catch (err) {
    console.error("❌ Error fetching emails:", err);
    res.status(500).json({ message: "Failed to fetch emails" });
  }
});

export default router;
