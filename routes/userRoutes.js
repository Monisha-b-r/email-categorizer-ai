import express from "express";
import { registerUser, loginUser } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { fetchEmails } from "../services/imapService.js";

const router = express.Router();

// User authentication routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected profile route
router.get("/profile", protect, (req, res) => {
  res.json({ message: "Welcome to your profile!", user: req.user });
});

// ✅ Fetch emails route (Protected)
router.get("/emails", protect, async (req, res) => {
  try {
    const account1 = {
      user: process.env.EMAIL1,
      pass: process.env.PASS1,
      host: "imap.gmail.com",
      port: 993
    };

    const account2 = {
      user: process.env.EMAIL2,
      pass: process.env.PASS2,
      host: "imap.gmail.com",
      port: 993
    };

    const emails1 = await fetchEmails(account1);
    const emails2 = await fetchEmails(account2);

    const allEmails = [...emails1, ...emails2];

    res.json({ emails: allEmails });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
