/**
 * Enhanced WhatsApp Service with retry support
 */
const twilio = require('twilio');
const { RetryHandler } = require('./retryHandler');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Retry handler for WhatsApp messages
const whatsappRetry = new RetryHandler({
  maxRetries: 3,
  initialDelay: 2000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'RATE_LIMIT', 'TWILIO_ERROR'],
});

/**
 * Format phone number to WhatsApp format
 */
function formatPhone(phone) {
  if (!phone) return null;

  const cleaned = phone.replace(/\D/g, '');

  // Handle Indian numbers
  if (cleaned.length === 10) {
    return `whatsapp:+91${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `whatsapp:+${cleaned}`;
  } else if (cleaned.length > 10) {
    return `whatsapp:+${cleaned}`;
  }

  return null;
}

/**
 * Send WhatsApp message with retry support
 * @param {string} phone - Phone number
 * @param {string} message - Message body
 * @param {string} mediaUrl - Media URL (PDF invoice)
 * @param {object} context - Context for logging
 * @returns {Promise<object>} - Send result
 */
async function sendWhatsAppMessageWithRetry(phone, message, mediaUrl = null, context = {}) {
  const result = {
    success: false,
    sid: null,
    error: null,
    phone: phone,
    ...context,
  };

  try {
    const formatted = formatPhone(phone);

    if (!formatted) {
      result.error = `Invalid phone number: ${phone}`;
      return result;
    }

    const payload = {
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: formatted,
      body: message,
    };

    if (mediaUrl) {
      payload.mediaUrl = [mediaUrl];
    }

    // Execute with retry
    const res = await whatsappRetry.execute(
      async () => {
        try {
          return await client.messages.create(payload);
        } catch (err) {
          // Wrap Twilio errors for retry handler
          err.code = err.code || 'TWILIO_ERROR';
          err.statusCode = err.status;
          throw err;
        }
      },
      'send_whatsapp_message',
      { phone: formatted }
    );

    result.success = true;
    result.sid = res.sid;
    result.status = res.status;

  } catch (error) {
    result.error = error.message;
    result.errorCode = error.code;
    result.errorStatus = error.statusCode || error.status;
  }

  return result;
}

module.exports = {
  sendWhatsAppMessageWithRetry,
  formatPhone,
};
