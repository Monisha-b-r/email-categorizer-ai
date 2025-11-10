import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export async function notifySlack(email) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("⚠️ SLACK_WEBHOOK_URL not found in .env");
    return;
  }

  if (email.category === "Interested") {
    console.log(
      `🔔 [Slack] Interested Email: ${email.subject} from ${email.from}`
    );
    await axios.post(webhookUrl, {
      subject: email.subject,
      from: email.from,
      category: email.category,
    });
  }
}
