const db = require('../db');
const { sendExpiryReminderEmail } = require('./email');

// Check for subscriptions expiring within the specified days
async function checkExpiringSubscriptions() {
  console.log('[SubscriptionReminder] Starting daily check...');

  try {
    // Find active subscriptions expiring in 1, 3, or 7 days
    const result = await db.query(`
      SELECT 
        s.id AS subscription_id,
        s.user_id,
        s.end_at,
        s.last_reminder_sent,
        u.email,
        u.name,
        u.display_name
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active'
        AND s.end_at IS NOT NULL
        AND s.end_at > NOW()
        AND s.end_at <= NOW() + INTERVAL '7 days'
      ORDER BY s.end_at ASC
    `);

    const subscriptions = result.rows;
    console.log(
      `[SubscriptionReminder] Found ${subscriptions.length} subscriptions expiring within 7 days`
    );

    for (const sub of subscriptions) {
      const daysLeft = Math.ceil(
        (new Date(sub.end_at) - Date.now()) / (24 * 60 * 60 * 1000)
      );

      // Determine if we should send a reminder
      // Send at 7 days, 3 days, and 1 day before expiry
      const shouldSendReminder = shouldSendReminderForDays(
        daysLeft,
        sub.last_reminder_sent
      );

      if (shouldSendReminder) {
        const userName = sub.display_name || sub.name || '';

        console.log(
          `[SubscriptionReminder] Sending reminder to ${sub.email} - ${daysLeft} day(s) left`
        );

        const emailResult = await sendExpiryReminderEmail(
          sub.email,
          userName,
          daysLeft,
          sub.end_at
        );

        if (emailResult.success) {
          // Update the last reminder sent timestamp
          await db.query(
            `UPDATE subscriptions SET last_reminder_sent = NOW() WHERE id = $1`,
            [sub.subscription_id]
          );
          console.log(
            `[SubscriptionReminder] Successfully sent reminder to ${sub.email}`
          );
        } else {
          console.error(
            `[SubscriptionReminder] Failed to send reminder to ${sub.email}:`,
            emailResult.error
          );
        }
      }
    }

    console.log('[SubscriptionReminder] Daily check completed');
    return { success: true, checked: subscriptions.length };
  } catch (error) {
    console.error('[SubscriptionReminder] Error during check:', error);
    return { success: false, error: error.message };
  }
}

// Determine if a reminder should be sent based on days left and last reminder
function shouldSendReminderForDays(daysLeft, lastReminderSent) {
  // Key days to send reminders
  const reminderDays = [7, 3, 1];

  // If not on a reminder day, skip
  if (!reminderDays.includes(daysLeft)) {
    return false;
  }

  // If no reminder was ever sent, send one
  if (!lastReminderSent) {
    return true;
  }

  // Don't send more than one reminder per day
  const lastSent = new Date(lastReminderSent);
  const now = new Date();
  const hoursSinceLastReminder = (now - lastSent) / (1000 * 60 * 60);

  return hoursSinceLastReminder >= 20; // At least 20 hours since last reminder
}

// Start the scheduler (run every day at 9 AM)
function startReminderScheduler() {
  // Run immediately on startup (after a small delay)
  setTimeout(() => {
    checkExpiringSubscriptions();
  }, 10000); // 10 second delay after server start

  // Then run every 24 hours
  setInterval(() => {
    const now = new Date();
    // Only run between 8 AM and 10 AM to avoid sending emails at odd hours
    if (now.getHours() >= 8 && now.getHours() <= 10) {
      checkExpiringSubscriptions();
    }
  }, 60 * 60 * 1000); // Check every hour, but only execute during the window

  console.log('[SubscriptionReminder] Scheduler initialized');
}

module.exports = {
  checkExpiringSubscriptions,
  startReminderScheduler,
};
