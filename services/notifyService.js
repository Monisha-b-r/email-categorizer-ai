// services/notifyService.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// 🧠 Simulated Slack notification (prints in console)
export async function notifySlack(email) {
  if (email.category === "Interested" || email.category === "Meeting Booked") {
    console.log(`💬 Slack Notification: ${email.category} → ${email.subject}`);
  }
}

export async function sendWebhook(email) {
  try {
    const WEBHOOK_URL = process.env.WEBHOOK_URL; // ✅ secure read

    if (!WEBHOOK_URL) {
      console.error("⚠️ WEBHOOK_URL is missing from .env file!");
      return;
    }

    // 🚫 Only send for key categories
    if (!["Interested", "Meeting Booked"].includes(email.category)) {
      console.log(`⏩ Skipped webhook for: ${email.category} (${email.subject})`);
      return;
    }

    await axios.post(WEBHOOK_URL, {
      subject: email.subject,
      category: email.category,
      body: email.body,
      timestamp: new Date(),
    });

    console.log(`🌍 Webhook sent for: ${email.subject}`);

    // 🕒 Small delay to prevent rate limit (webhook.site = 5 req/sec)
    await new Promise((r) => setTimeout(r, 500));

  } catch (err) {
    console.error("❌ Webhook failed:", err.message);
  }
}
