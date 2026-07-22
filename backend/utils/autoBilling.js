
const cron = require('node-cron');
const { generateMonthlyBills } = require('./autoBillingLogic');
const { Logger } = require('./logger');

const logger = new Logger('scheduler');

// Verify cron expression in development
logger.info('Monthly billing scheduler initialized', {
  cronExpression: '0 1 1 * *',
  schedule: '1st of every month at 1:00 AM',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Approx next month
});

// Schedule: 1st of every month at 1:00 AM
// In production, this runs automatically
// In development, manual trigger via testBilling.js or force:true option
cron.schedule('0 1 1 * *', async () => {
  logger.info('📅 Monthly billing triggered automatically');
  try {
    await generateMonthlyBills();
  } catch (error) {
    logger.error('Billing run crashed', error);
  }
});