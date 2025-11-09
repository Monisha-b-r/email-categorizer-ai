// services/gmailSync.js
import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { indexEmail } from "../config/elastic.js";
import { notifySlack, sendWebhook } from "./notifyService.js";

const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
const TOKEN_PATH = path.join(process.cwd(), "token.json");

async function authorize() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

export async function fetchRecentEmails() {
  const auth = await authorize();
  const gmail = google.gmail({ version: "v1", auth });

  console.log("📨 Fetching last 30 days of emails...");

  const res = await gmail.users.messages.list({
    userId: "me",
    q: "newer_than:30d",
    maxResults: 10,
  });

  const messages = res.data.messages || [];
  console.log(`📬 Found ${messages.length} emails.`);

  for (const msg of messages) {
    const messageId = msg.id;

    // ✅ Check if this email already exists in Elasticsearch
    try {
      const existing = await fetch(`http://localhost:9200/emails/_doc/${messageId}`);
      if (existing.status === 200) {
        console.log(`⏩ Skipped duplicate: ${messageId}`);
        continue;
      }
    } catch (err) {
      console.warn("⚠️  Error checking existing email:", err.message);
    }

    const fullMsg = await gmail.users.messages.get({ userId: "me", id: msg.id });
    const snippet = fullMsg.data.snippet || "";
    const subjectHeader = fullMsg.data.payload.headers.find((h) => h.name === "Subject");
    const subject = subjectHeader ? subjectHeader.value : "(No Subject)";

    let category = "General";
    const lower = snippet.toLowerCase();
    if (lower.includes("meeting")) category = "Meeting Booked";
    else if (lower.includes("interested")) category = "Interested";
    else if (lower.includes("not interested")) category = "Not Interested";
    else if (lower.includes("spam")) category = "Spam";
    else if (lower.includes("out of office")) category = "Out of Office";

    // ✅ Use Gmail messageId as document ID to avoid duplicates
    await indexEmail({ subject, body: snippet, category, createdAt: new Date() }, messageId);
    console.log(`✅ Indexed: ${subject} → ${category}`);

    await notifySlack({ subject, body: snippet, category });
    await sendWebhook({ subject, body: snippet, category });
  }

  console.log("🎯 Gmail sync completed!");
}
