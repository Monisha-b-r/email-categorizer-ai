import axios from "axios";

export async function notifySlack(email) {
  if (email.category === "Interested") {
    console.log(
      `🔔 [Slack Simulation] New Interested Email: ${email.subject} from ${email.from}`
    );

    const webhookUrl = process.env.WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn("⚠️ WEBHOOK_URL not found in .env, skipping webhook call.");
      return;
    }

    // Trigger webhook (safe via .env)
    await axios.post(webhookUrl, {
      subject: email.subject,
      from: email.from,
      category: email.category,
    });
  }
}
