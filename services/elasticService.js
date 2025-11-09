import { Client } from "@elastic/elasticsearch";

const client = new Client({
  node: process.env.ELASTIC_URL,
  auth: {
    username: process.env.ELASTIC_USER,
    password: process.env.ELASTIC_PASS
  }
});

export async function indexEmail(email) {
  await client.index({
    index: "emails",
    document: email
  });
}
