const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const MilkEntry = require('../models/MilkEntry');
const { Logger } = require('./logger');

const logger = new Logger('scheduler-daily');

// Price default for automated drops
const DEFAULT_PRICE_PER_LITRE = 80;

/**
 * Automatically creates daily delivery entries from active customer subscriptions
 */
async function generateDailySubscriptionDeliveries() {
  logger.info('☀️ Running daily subscription deliveries generation...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeSubscriptions = await Subscription.find({ isActive: true }).populate('userId');

    logger.info(`Found ${activeSubscriptions.length} active subscriptions to check.`);

    let count = 0;

    for (const sub of activeSubscriptions) {
      if (!sub.userId) {
        continue;
      }

      // Check frequency rules:
      let shouldDeliverToday = true;

      if (sub.frequency === 'alternate') {
        // Alternate days: deliver only on odd days of the month
        const dateNum = new Date().getDate();
        shouldDeliverToday = (dateNum % 2 !== 0); 
      } else if (sub.frequency === 'weekly') {
        // Weekly days: deliver only on Sundays
        const weekday = new Date().getDay();
        shouldDeliverToday = (weekday === 0); 
      }

      if (!shouldDeliverToday) {
        logger.info(`Skipping alternating/weekly drop for @${sub.userId.username} today.`);
        continue;
      }

      // Create MilkEntry record representing drop-off
      const totalPrice = sub.quantity * DEFAULT_PRICE_PER_LITRE;
      
      // Prevent double generation for same customer + session + date
      const exists = await MilkEntry.findOne({
        userId: sub.userId._id,
        date: today,
        session: sub.timeSlot
      });

      if (exists) {
        logger.info(`Delivery already logged for @${sub.userId.username} today.`);
        continue;
      }

      await MilkEntry.create({
        userId: sub.userId._id,
        quantity: sub.quantity,
        pricePerLitre: DEFAULT_PRICE_PER_LITRE,
        totalPrice,
        session: sub.timeSlot,
        date: today,
        entryType: "ORDER", // Auto-created subscriptions are order-based deliveries
        notes: `Subscription Drop-off (${sub.frequency})`,
      });

      count++;
    }

    logger.success(`Successfully logged ${count} automated subscription drops for today!`);
  } catch (err) {
    logger.error('Subscription deliveries generator crashed', err);
  }
}

// Schedule: Daily at 12:05 AM
cron.schedule('0 5 0 * * *', async () => {
  await generateDailySubscriptionDeliveries();
});

module.exports = { generateDailySubscriptionDeliveries };