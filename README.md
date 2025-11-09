## ⚙️ Overview

This project implements a **feature-rich Onebox Email Aggregator**, similar to _ReachInbox_, capable of syncing multiple Gmail accounts in real-time, categorizing emails using AI logic, indexing with Elasticsearch, and triggering Slack & Webhook notifications.

It is developed as part of the **ReachInbox Associate Backend Engineer Assignment**.

---

🧠 Features Implemented

✅ **1. Real-Time Email Synchronization (IMAP/Gmail API)**

- Connects multiple Gmail accounts
- Fetches last 30 days of emails
- Uses persistent OAuth authentication

✅ **2. Searchable Email Storage (Elasticsearch)**

- Emails are indexed in a local Elasticsearch instance
- Supports full-text search and filtering by account/folder

✅ **3. AI-Based Email Categorization**

- Categorizes emails into:
  - Interested
  - Meeting Booked
  - Not Interested
  - Spam
  - Out of Office

✅ **4. Slack & Webhook Integration**

- Sends simulated Slack notifications for “Interested” emails
- Posts JSON payloads to [webhook.site](https://webhook.site)

✅ **5. (Optional) Frontend UI**

- Displays all emails, categories, and filters
- Search bar connected with Elasticsearch

✅ **6. AI Suggested Replies (Planned)**

- Next step: Integrate RAG (Retrieval-Augmented Generation)
- Suggest reply drafts using fine-tuned LLMs

---

## 🧩 Tech Stack

| Layer               | Technology                     |
| ------------------- | ------------------------------ |
| Backend             | Node.js, Express.js            |
| Database            | MongoDB Atlas                  |
| Search Engine       | Elasticsearch (Docker)         |
| Auth & Mail API     | Gmail API (OAuth 2.0)          |
| Notifications       | Slack API (Mock), Webhook.site |
| Testing             | Postman                        |
| Frontend (Optional) | React.js                       |

---

## 🛠️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Monisha-b-r/email-categorizer-ai.git
cd email-categorizer-ai
2️⃣ Create a .env File
env
Copy code
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=mysecretkey123

# Elasticsearch Config
ELASTIC_URL=http://localhost:9200
ELASTIC_USER=elastic
ELASTIC_PASS=password

# Gmail OAuth Config
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
REDIRECT_URI=http://localhost
REFRESH_TOKEN=your_refresh_token
3️⃣ Install Dependencies
bash
Copy code
npm install
4️⃣ Run the Server
bash
Copy code
npm run dev
Server runs on:
🔗 http://localhost:5000

🔍 API Testing (via Postman)
Endpoint	Method	Description
/api/emails	GET	Fetch all synced emails
/api/categorize	POST	Categorize new emails
/api/users/register	POST	Register a user
/api/users/login	POST	User authentication

⚡ Real-Time Email Sync Setup
Create Gmail OAuth credentials from Google Cloud Console.

Save them in .env (not in code).

Run node gmailAuth.js once to generate token.json.

The system will use Gmail API to fetch & categorize emails.

🧩 Elasticsearch Setup (Docker)
Run this once:

bash
Copy code
docker run -d --name elasticsearch \
  -e "discovery.type=single-node" \
  -p 9200:9200 \
  docker.elastic.co/elasticsearch/elasticsearch:8.10.2
Then visit:
🔗 http://localhost:9200

🔔 Notifications
Slack Simulation: Logs messages for Interested leads.

Webhook Integration: Sends POST requests to Webhook.site for automation triggers.

🧩 Future Enhancements
Implement real-time Gmail Watch API (for push notifications).

Add RAG-based AI reply generation using OpenAI / Gemini API.

Build a polished React frontend (Inbox UI).
```
