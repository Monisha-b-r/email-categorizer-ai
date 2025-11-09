import axios from 'axios';
// services/notifyService.js

export async function notifySlack(email) {
  if (email.category === "Interested") {
    // Simulation of Slack notification
    console.log(`🔔 [Slack Simulation] New Interested Email: ${email.subject} from ${email.from}`);
    
    // ✅ If you get a real webhook, uncomment this:
    // import axios from "axios";
    // await axios.post("YOUR_SLACK_WEBHOOK_URL", {
    //   text: `New Interested Email: ${email.subject} from ${email.from}`
    // });
  }
}

export async function notifyWebhook(email) {
  if (email.category === 'Interested') {
    await axios.post('https://webhook.site/your-id', {
      subject: email.subject,
      from: email.from,
      body: email.body
    });
  }
}
