// cleanup.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Email from "./models/Email.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function cleanEmails() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const result = await Email.deleteMany({});
    console.log(`🧹 Deleted ${result.deletedCount} old emails`);

    await mongoose.disconnect();
    console.log("✅ Disconnected. Cleanup done!");
  } catch (err) {
    console.error("❌ Error during cleanup:", err);
  }
}

cleanEmails();
