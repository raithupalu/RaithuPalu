const { sendEmail, isEmailConfigured, EMAIL_USER } = require("../utils/emailService");

exports.sendTestEmail = async (req, res, next) => {
  try {
    if (!isEmailConfigured()) {
      const err = new Error(
        "Email service is not configured. Set EMAIL_USER and EMAIL_APP_PASSWORD in the backend environment."
      );
      err.status = 500;
      throw err;
    }
    const to = (req.body && req.body.to && req.body.to.trim()) || EMAIL_USER;
    const info = await sendEmail({
      to,
      subject: "RaithuPalu Email Test",
      text:
        "Hello,\n\nThis is a test email from the RaithuPalu backend.\n\nIf you received this email, Gmail SMTP configuration is working correctly.\n\nRaithuPalu",
    });
    return res.json({ success: true, message: "Test email sent successfully.", messageId: info.messageId || null });
  } catch (error) {
    const err = new Error(`Failed to send email. ${error.message}. Check EMAIL_USER / EMAIL_APP_PASSWORD configuration.`);
    err.status = 500;
    next(err);
  }
};