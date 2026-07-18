# Fresher Hub - Security Implementation Guide

## Overview
This document outlines the security measures implemented in the Fresher Hub authentication system and provides a roadmap for future security enhancements.

---

## ✅ Implemented Security Features

### 1. **Two-Step Activation Flow**
- **Step 1**: Verify OTP (marks OTP as used, does NOT activate account)
- **Step 2**: Set password (completes activation)
- **Benefit**: Even if OTP is compromised, account remains inactive without password

### 2. **Two-Step Password Reset Flow**
- **Step 1**: Request OTP (forgot-password)
- **Step 2**: Verify OTP (reset-password screen 1)
- **Step 3**: Set new password (reset-password screen 2)
- **Benefit**: Modern standard, prevents unauthorized password changes

### 3. **Generic Error Messages** (Prevents Information Leakage)
- ✅ Login: Always returns "Invalid email or password"
- ✅ OTP Verification: Returns "Invalid or expired code"
- ✅ Password Reset: Returns "Invalid or expired code"
- ✅ Frontend: All error messages are generic
- **Benefit**: Prevents user enumeration attacks

### 4. **Password Reset for Activated Users Only**
- Non-activated users cannot reset passwords
- Backend returns generic message regardless of account status
- **Benefit**: Prevents abuse of password reset flow

### 5. **Rate Limiting** (In-Memory Implementation)
```javascript
// Current limits:
- Login: 5 attempts per 15 minutes
- OTP Request: 3 attempts per hour
- Password Reset: 3 attempts per hour
```
**Location**: `apps/api/src/middleware/rateLimiter.js`

### 6. **Account Lockout**
- **Trigger**: 5 failed login attempts
- **Duration**: 30 minutes
- **Auto-clear**: On successful login or after lockout expires
- **Benefit**: Prevents brute force attacks

### 7. **Failed Login Tracking**
- Tracks failed attempts per email
- Logs IP address for all login attempts
- Clears on successful login
- **Benefit**: Enables fraud detection and alerting

### 8. **Secure Password Storage**
- Bcrypt hashing with `gen_salt('bf')`
- Passwords never stored in plaintext
- OTPs hashed in database

### 9. **OTP Security**
- 6-digit OTPs
- 15-minute expiration
- Single-use (consumed_at timestamp)
- Hashed in database

### 10. **Comprehensive Logging**
All security events logged to console:
- ✅ Login attempts (success/failure) with IP
- ✅ OTP generation and verification
- ✅ Password reset requests
- ✅ Account lockouts
- ✅ Rate limit violations

---

## 📋 TODO: Future Security Enhancements

### 1. **Replace In-Memory Stores with Redis** (High Priority)
**Current**: Rate limiting and lockout data stored in memory (lost on restart)
**Required**: Use Redis for production
```javascript
// TODO: Install Redis
npm install redis

// TODO: Update rateLimiter.js to use Redis
// Example:
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Replace Map operations with Redis commands
await client.setex(`rate_limit:${identifier}`, windowMs, count);
```

### 2. **Integrate Sentry for Monitoring** (High Priority)
**Current**: Logging to console only
**Required**: Send critical events to Sentry
```javascript
// TODO: Install Sentry
npm install @sentry/node

// TODO: Initialize in server.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });

// TODO: Add to authController.js
// After 3 failed login attempts:
Sentry.captureMessage(`Multiple failed login attempts for ${email}`, 'warning');

// On successful login from new IP:
Sentry.captureMessage(`New login from ${clientIp} for ${email}`, 'info');
```

### 3. **Implement CAPTCHA** (Medium Priority)
**Trigger**: After 3 failed login attempts
**Required**: Add CAPTCHA challenge to login form
```javascript
// TODO: Install CAPTCHA library
npm install @hcaptcha/react-hcaptcha

// TODO: Add to login.tsx
// Show CAPTCHA after 3 failed attempts
const [showCaptcha, setShowCaptcha] = useState(false);

// TODO: Add to rateLimiter.js
function checkCaptchaRequired(email) {
  const record = rateLimitStore.get(email);
  return record && record.count >= 3;
}
```

### 4. **Implement Email Service** (High Priority)
**Current**: OTPs printed to console
**Required**: Send actual emails
```javascript
// TODO: Choose email provider (SendGrid, AWS SES, Mailgun)
npm install @sendgrid/mail

// TODO: Create email service
// apps/api/src/services/emailService.js
async function sendOTPEmail(email, otp) {
  await sgMail.send({
    to: email,
    from: 'noreply@fresherhub.com',
    subject: 'Your Fresher Hub OTP',
    html: `<p>Your OTP is: <strong>${otp}</strong></p>`
  });
}

// TODO: Replace console.log in authService.js
// Line ~186: await sendOTPEmail(user.email, otp);
// Line ~215: await sendPasswordResetEmail(user.email, otp);
```

### 5. **Add IP-Based Rate Limiting** (Medium Priority)
**Current**: Rate limiting by email only
**Required**: Also limit by IP address
```javascript
// TODO: Update rateLimiter.js
function rateLimit(action) {
  return (req, res, next) => {
    const emailIdentifier = req.body?.email;
    const ipIdentifier = `ip:${req.ip}`;
    
    // Check both email and IP limits
    if (isRateLimited(emailIdentifier) || isRateLimited(ipIdentifier)) {
      return res.status(429).json({ error: "Too many attempts" });
    }
    
    next();
  };
}
```

### 6. **Device Fingerprinting** (Low Priority)
**Purpose**: Detect suspicious login patterns
```javascript
// TODO: Add device fingerprinting library
npm install @shmuelie/fingerprintjs

// TODO: Create middleware
async function detectSuspiciousLogin(req, res, next) {
  const fingerprint = req.body.deviceFingerprint;
  const user = await getLastLoginDevice(userId);
  
  if (fingerprint !== user.lastFingerprint) {
    // TODO: Send email notification
    // TODO: Log to Sentry
    // TODO: Require additional verification
  }
  
  next();
}
```

### 7. **JWT Blacklisting** (Low Priority)
**Current**: Refresh tokens revoked on logout
**Required**: Blacklist access tokens before expiry
```javascript
// TODO: Add JWT blacklist table
CREATE TABLE IF NOT EXISTS token_blacklist (
  token_hash TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

// TODO: Add to logout handler
async function blacklistToken(token) {
  const payload = verifyJwt(token);
  if (!payload) return;
  
  await client.query(`
    INSERT INTO token_blacklist (token_hash, expires_at)
    VALUES ($1, to_timestamp($2))
  `, [hashToken(token), payload.exp]);
}

// TODO: Add middleware to check blacklist
async function checkTokenBlacklist(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (await isBlacklisted(token)) {
    return res.status(401).json({ error: "Token revoked" });
  }
  next();
}
```

### 8. **Email Notifications** (Medium Priority)
**Required**: Send emails for security events
```javascript
// TODO: Create email templates
// - Welcome email on activation
// - Password change confirmation
// - New login from unrecognized device
// - Account lockout notification

// TODO: Add to authController.js
// After successful activation:
await sendWelcomeEmail(user.email, user.fullName);

// After password reset:
await sendPasswordChangedEmail(user.email);

// After successful login from new IP:
await sendNewLoginEmail(user.email, clientIp, newDevice);
```

### 9. **Add Monitoring Dashboard** (Low Priority)
**Required**: Track security metrics
```javascript
// TODO: Create metrics endpoint (protected)
GET /api/admin/auth/metrics

// Return:
{
  "failedLoginsLast24h": 150,
  "lockedAccounts": 3,
  "otpRequestsLast24h": 45,
  "passwordResetsLast24h": 12,
  "topFailedLoginEmails": [...],
  "topIPs": [...]
}
```

### 10. **Implement Request Logging Middleware** (Medium Priority)
```javascript
// TODO: Create request logger middleware
// apps/api/src/middleware/requestLogger.js
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // TODO: Send to monitoring service
    // TODO: Alert on suspicious patterns
  });
  
  next();
}

// TODO: Apply to all routes
app.use('/auth', requestLogger, authRoutes);
```

---

## 🔒 Security Best Practices

### Password Policy
- ✅ Minimum 6 characters (consider increasing to 8+)
- ⚠️ TODO: Add password strength validation
- ⚠️ TODO: Check against breached password databases (HaveIBeenPwned)

### Session Management
- ✅ JWT with 15-minute expiry
- ✅ Refresh tokens with 30-day expiry
- ✅ Refresh tokens revoked on logout
- ⚠️ TODO: Implement JWT blacklisting
- ⚠️ TODO: Add session management dashboard

### Input Validation
- ✅ Zod validation schemas
- ✅ Email format validation
- ✅ Password minimum length
- ⚠️ TODO: Add SQL injection prevention (using parameterized queries ✅)
- ⚠️ TODO: Add XSS prevention headers

### HTTPS
- ⚠️ TODO: Enforce HTTPS in production
- ⚠️ TODO: Add HSTS headers
- ⚠️ TODO: Use secure cookies for refresh tokens

### CORS
- ⚠️ TODO: Configure CORS properly for production
- ⚠️ TODO: Whitelist only trusted domains

---

## 🚨 Security Incident Response

### If Rate Limits Are Being Hit:
1. Check logs for IP addresses
2. Verify if it's legitimate traffic or attack
3. Consider temporarily increasing limits
4. Block malicious IPs if needed

### If Account Lockouts Increase:
1. Review if users are forgetting passwords
2. Check for coordinated attacks
3. Consider adding "Forgot password" link on lockout screen
4. Send email notification to affected users

### If OTP Brute Force Detected:
1. Reduce OTP validity period
2. Increase OTP length to 8 digits
3. Add delays between OTP attempts
4. Send alert to security team

---

## 📊 Monitoring Checklist

### Daily:
- [ ] Review failed login attempts
- [ ] Check for account lockouts
- [ ] Monitor rate limit violations

### Weekly:
- [ ] Review Sentry alerts
- [ ] Check for suspicious IP addresses
- [ ] Audit password reset requests

### Monthly:
- [ ] Review security logs
- [ ] Update dependencies
- [ ] Test incident response procedures

---

## 🔗 Resources

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Sentry Documentation](https://docs.sentry.io/)
- [Redis Documentation](https://redis.io/docs/)
- [SendGrid Documentation](https://docs.sendgrid.com/)

---

## 📝 Notes

- All TODOs should be implemented before production deployment
- Rate limiting currently uses in-memory storage (not suitable for multiple server instances)
- Email service must be implemented before production (currently mocked)
- Sentry integration is critical for production monitoring
- Regular security audits recommended quarterly

**Last Updated**: 2026-05-18
**Version**: 1.0.0