// config/elastic.js
import { Client } from "@elastic/elasticsearch";

const client = new Client({
  node: process.env.ELASTIC_URL || "http://localhost:9200",
  auth: {
    username: process.env.ELASTIC_USER || "elastic",
    password: process.env.ELASTIC_PASS || "password",
  },
});

export async function indexEmail(email, id) {
  try {
    await client.index({
      index: "emails",
      id, // ✅ ensures no duplicates
      document: email,
      refresh: "wait_for",
    });
    console.log("✅ Email indexed:", email.subject);
  } catch (err) {
    console.error("❌ Error indexing email:", err.meta?.body?.error || err.message);
  }
}

export { client };

export async function createEmailIndex() {
  try {
    const existsResp = await client.indices.exists({ index: "emails" });
    const exists = existsResp?.body ?? existsResp; // handle different client versions
    if (!exists) {
      await client.indices.create({ index: "emails" });
      console.log("✅ Created 'emails' index");
    } else {
      console.log("ℹ️  'emails' index already exists");
    }
  } catch (err) {
    console.error("❌ Error creating index:", err.message || err);
  }
}
