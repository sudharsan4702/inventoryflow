const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const Admin = require("../server/Admin");

dotenv.config();

const otpStore = {}; // Temporary OTP storage (use Redis in production)

// 🔹 **Email Transporter Configuration**
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🔹 **Send OTP to Admin Email**
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin) return res.status(404).json({ message: "Admin not found" });

  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
  otpStore[email] = otp;

  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP for password change is: ${otp}. It is valid for 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// 🔹 **Change Admin Password**
router.post("/change-password", async (req, res) => {
  const { email, currentPassword, newPassword, otp } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin) return res.status(404).json({ message: "Admin not found" });

  if (!otpStore[email] || otpStore[email] !== parseInt(otp)) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  const passwordMatch = await bcrypt.compare(currentPassword, admin.password);
  if (!passwordMatch) return res.status(400).json({ message: "Incorrect current password" });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  admin.password = hashedPassword;
  await admin.save();

  delete otpStore[email]; // Remove OTP after use

  res.json({ message: "Password changed successfully" });
});

// 🔹 **Logout from All Devices**
router.post("/logout-all", async (req, res) => {
  res.json({ message: "Logged out from all devices" });
});

module.exports = router;
