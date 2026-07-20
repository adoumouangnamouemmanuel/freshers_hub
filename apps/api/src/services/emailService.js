/**
 * Email Service — Mock Implementation
 *
 * All functions below simulate email delivery by logging to the console.
 * Each function is clearly marked with a TODO indicating exactly what to
 * replace with a real transactional email provider (e.g. SendGrid, AWS SES).
 *
 * Search the codebase for "TODO: EMAIL" to find all integration points.
 */

const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPER
// ─────────────────────────────────────────────────────────────────────────────

function mockEmail(type, to, data = {}) {
  console.log(`\n======================================================`);
  console.log(`[MOCK EMAIL] Type     : ${type}`);
  console.log(`[MOCK EMAIL] To       : ${to}`);
  Object.entries(data).forEach(([key, val]) => {
    console.log(`[MOCK EMAIL] ${key.padEnd(10)}: ${val}`);
  });
  console.log(`======================================================\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. WELCOME EMAIL — First successful account activation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sent after a student successfully sets their password for the first time.
 *
 * @param {string} email    - Student email address
 * @param {string} fullName - Student full name
 */
async function sendWelcomeEmail(email, fullName) {
  logger.info(`[EMAIL] Sending welcome email to ${email}`);

  // TODO: EMAIL — Replace mock with real provider call, e.g.:
  // await sgMail.send({
  //   to: email,
  //   from: 'noreply@fresherhub.ashesi.edu.gh',
  //   templateId: process.env.SENDGRID_WELCOME_TEMPLATE_ID,
  //   dynamicTemplateData: { fullName },
  // });

  mockEmail('WELCOME', email, { fullName });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PASSWORD CHANGED EMAIL — Password reset OR in-app change
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sent as a security alert after a password is changed or reset.
 *
 * @param {string} email                  - Student email address
 * @param {string} ip                     - IP address of the request
 * @param {'reset'|'change'} changeType   - Whether it was a forgot-password reset or an in-app change
 */
async function sendPasswordChangedEmail(email, ip, changeType = 'change') {
  const label = changeType === 'reset' ? 'PASSWORD RESET' : 'PASSWORD CHANGED';
  logger.info(`[EMAIL] Sending ${label.toLowerCase()} notification to ${email}`);

  // TODO: EMAIL — Replace mock with real provider call, e.g.:
  // await sgMail.send({
  //   to: email,
  //   from: 'noreply@fresherhub.ashesi.edu.gh',
  //   templateId: process.env.SENDGRID_PASSWORD_CHANGED_TEMPLATE_ID,
  //   dynamicTemplateData: { changeType, ip, timestamp: new Date().toISOString() },
  // });

  mockEmail(label, email, { ip, timestamp: new Date().toISOString() });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ACCOUNT LOCKOUT EMAIL — Account locked after too many failed logins
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sent when an account gets locked to notify the user and guide them to reset.
 *
 * @param {string} email        - Student email address
 * @param {number} lockDuration - Lockout duration in minutes
 */
async function sendAccountLockedEmail(email, lockDuration = 30) {
  logger.info(`[EMAIL] Sending account lockout notification to ${email}`);

  // TODO: EMAIL — Replace mock with real provider call, e.g.:
  // await sgMail.send({
  //   to: email,
  //   from: 'noreply@fresherhub.ashesi.edu.gh',
  //   templateId: process.env.SENDGRID_LOCKOUT_TEMPLATE_ID,
  //   dynamicTemplateData: {
  //     lockDuration,
  //     resetUrl: process.env.APP_DEEP_LINK + '/forgot-password',
  //   },
  // });

  mockEmail('ACCOUNT LOCKED', email, {
    lockDuration: `${lockDuration} minutes`,
    action: 'Use "Forgot Password?" in the app to regain access',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. NEW LOGIN NOTIFICATION — Login from any IP (future: unrecognized IPs only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Alerts the user of a successful login. In a future iteration, this should
 * compare against the user's known IPs and only fire for unrecognized ones.
 *
 * @param {string} email - Student email address
 * @param {string} ip    - IP address of the successful login
 */
async function sendNewLoginEmail(email, ip) {
  logger.info(`[EMAIL] Sending login notification to ${email} (IP: ${ip})`);

  // TODO: EMAIL — Replace mock with real provider call, e.g.:
  // await sgMail.send({
  //   to: email,
  //   from: 'noreply@fresherhub.ashesi.edu.gh',
  //   templateId: process.env.SENDGRID_NEW_LOGIN_TEMPLATE_ID,
  //   dynamicTemplateData: { ip, timestamp: new Date().toISOString() },
  // });

  // TODO: ENHANCEMENT — Before sending, look up the user's `known_ips` in DB
  // and only send this email when the login IP is not in the known list.

  mockEmail('NEW LOGIN', email, {
    ip,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordChangedEmail,
  sendAccountLockedEmail,
  sendNewLoginEmail,
};
