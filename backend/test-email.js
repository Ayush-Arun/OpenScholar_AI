require('dotenv').config();
const nodemailer = require('nodemailer');

console.log("Testing email for:", process.env.EMAIL_USER);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER,
  subject: 'Test Email',
  text: 'If you see this, email is working!'
}, (err, info) => {
  if (err) {
    console.error("❌ Email failed:", err.message);
  } else {
    console.log("✅ Email sent successfully!", info.messageId);
  }
  process.exit();
});
