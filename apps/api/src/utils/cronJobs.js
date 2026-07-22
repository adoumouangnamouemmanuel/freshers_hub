const cron = require('node-cron');
const notificationService = require('../services/notificationService');
const logger = require('./logger');

const initCronJobs = () => {
  // Process due reminders every minute
  cron.schedule('* * * * *', async () => {
    try {
      const processed = await notificationService.processDueReminders();
      if (processed > 0) {
        logger.info(`[Cron] Processed ${processed} due reminders.`);
      }
    } catch (error) {
      logger.error(`[Cron] Error processing reminders: ${error.message}`);
    }
  });

  // Prune read notifications older than 30 days every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const pruned = await notificationService.pruneOldNotifications();
      if (pruned > 0) {
        logger.info(`[Cron] Pruned ${pruned} old notifications.`);
      }
    } catch (error) {
      logger.error(`[Cron] Error pruning notifications: ${error.message}`);
    }
  });

  logger.info('[Cron] Notification jobs initialized.');
};

module.exports = { initCronJobs };
