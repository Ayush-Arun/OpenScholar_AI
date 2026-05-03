// ============================================
// EMAIL SERVICE
// Sends digest via Gmail SMTP
// ============================================

const nodemailer = require("nodemailer");
const { generateEmailHTML, generatePlainText } = require("../agents/reportAgent");

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

async function sendDigest(digestData, recipients) {
  const transporter = createTransporter();

  const subject = `🧠 OpenScholar AI Weekly Digest - ${new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric"
  })}`;

  const htmlContent = generateEmailHTML(digestData);
  const textContent = generatePlainText(digestData);

  const recipientList = recipients ||
    (process.env.RECIPIENT_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);

  if (!recipientList.length) {
    console.error("[EmailService] No recipients configured");
    return { success: false, error: "No recipients" };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: recipientList.join(", "),
      subject,
      text: textContent,
      html: htmlContent
    });

    console.log(`[EmailService] Digest sent to ${recipientList.length} recipients. ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId, recipients: recipientList };
  } catch (err) {
    console.error("[EmailService] Send error:", err.message);
    return { success: false, error: err.message };
  }
}

async function sendTestEmail(recipient) {
  const transporter = createTransporter();
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: recipient,
      subject: "✅ OpenScholar AI - Email Test",
      text: "Your OpenScholar AI email configuration is working correctly!"
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { sendDigest, sendTestEmail };
