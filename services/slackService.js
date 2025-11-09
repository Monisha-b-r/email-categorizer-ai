import axios from "axios";

export async function notifySlack(email) {
  if (email.category === "Interested") {
    console.log(`🔔 [Slack Simulation] New Interested Email: ${email.subject} from ${email.from}`);

    // Trigger webhook (you can use webhook.site)
    await axios.post("https://webhook.site/35433ba8-a3e1-47fc-860c-b15d65d17f9c", {
      subject: email.subject,
      from: email.from,
      category: email.category,
    });
  }
}
