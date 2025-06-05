const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail
    pass: process.env.EMAIL_PASS, // App password (not your actual password)
  },
});

/**
 * Sends OTP to the given email
 */
async function sendOtp(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP for Admin",
    text: `Your OTP is: ${otp}. It is valid for 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendOtp;
