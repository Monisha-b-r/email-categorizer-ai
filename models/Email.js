// models/Email.js
import mongoose from "mongoose";

const emailSchema = new mongoose.Schema({
  subject: String,
  from: String,
  to: String,
  body: String,
  category: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Email", emailSchema);
