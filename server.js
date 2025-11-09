// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import { createEmailIndex } from "./config/elastic.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api", emailRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ✅ Connect to MongoDB first
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected successfully");

    // ✅ Create Elasticsearch index safely
    await createEmailIndex();

    // ✅ Start the server only after DB + Index setup
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.log("❌ MongoDB connection failed:", err.message));

// ✅ Optional test route
app.get("/", (req, res) => {
  res.send("🚀 ReachInbox Backend Running!");
});

// -------- STEP 3: AI-Based Email Categorization --------

// Simple keyword-based categorizer function
function categorizeEmail(subject, body) {
  const text = (subject + " " + body).toLowerCase();

  if (text.includes("meeting") || text.includes("schedule") || text.includes("call"))
    return "Meeting Booked";
  if (text.includes("interested") || text.includes("let's connect"))
    return "Interested";
  if (text.includes("not interested") || text.includes("decline"))
    return "Not Interested";
  if (text.includes("out of office") || text.includes("ooo"))
    return "Out of Office";
  if (text.includes("unsubscribe") || text.includes("spam"))
    return "Spam";

  return "General";
}

// ✅ POST API: Categorize email
app.post("/api/categorize", (req, res) => {
  const { subject, body } = req.body;

  if (!subject || !body) {
    return res.status(400).json({ message: "Subject and body are required." });
  }

  const category = categorizeEmail(subject, body);
  res.json({ category });
});
