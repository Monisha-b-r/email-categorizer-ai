import { indexEmail } from "./config/elastic.js";

const testEmail = {
  subject: "Hello from Monisha test email",
  from: "monisha@example.com",
  body: "This is a test email indexed into Elasticsearch.",
};

await indexEmail(testEmail);
