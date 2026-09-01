const nodemailer = require("nodemailer");
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;

let transporter = null;
let transporterError = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!EMAIL_USER || !EMAIL_APP_PASSWORD) {
    transporterError = "Email service is not configured. Set EMAIL_USER and EMAIL_APP_PASSWORD in the backend environment.";
    return null;
  }
  try {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: EMAIL_USER, pass: EMAIL_APP_PASSWORD },
    });
    transporterError = null;
    return transporter;
  } catch (error) {
    transporterError = error.message;
    return null;
  }
}

async function sendEmail({ to, subject, text, html }) {
  const activeTransporter = getTransporter();
  if (!activeTransporter) throw new Error(transporterError || "Email service is not configured.");
  if (!to) throw new Error("Recipient email address is required.");
  return activeTransporter.sendMail({
    from: `"RaithuPalu" <${EMAIL_USER}>`,
    to, subject, text, ...(html ? { html } : {}),
  });
}

function isEmailConfigured() {
  return Boolean(EMAIL_USER && EMAIL_APP_PASSWORD);
}

module.exports = { sendEmail, isEmailConfigured, EMAIL_USER };