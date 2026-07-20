# Fresher Hub - Security Implementation Guide

## Overview
This document outlines the security measures implemented in the Fresher Hub authentication system and provides a roadmap for future security enhancements.

---

## ✅ Implemented Security Features

### 1. **Two-Step Activation Flow**
- **Step 1**: Verify OTP → Redis marks key as `consumed` (account NOT yet activated)
- **Step 2**: Set password → Redis key deleted, account activated in PostgreSQL
- **Benefit**: Even if OTP is compromised, account remains inactive without the password step

### 2. **Two-Step Password Reset Flow**
- **Step 1**: Request OTP (`forgot-password`) — OTP generated and stored in Redis
- **Step 2**: Verify OTP (`verify-reset-otp`) — Redis marks key as `consumed`
- **Step 3**: Set new password (`set-new-password`) — Redis key deleted, password updated in PostgreSQL
- **Benefit**: Modern standard, prevents unauthorized password changes

### 3. **Generic Error Messages** (Prevents Information Leakage)
- ✅ Login: Always returns "Invalid credentials"
- ✅ OTP Verification: Returns "Invalid or expired OTP"
- ✅ Password Reset: Returns "Invalid or expired code"
- ✅ Forgot Password / Verify Reset OTP: Returns same generic message regardless of whether the user exists
- **Benefit**: Prevents user enumeration attacks

### 4. **Password Reset for Activated Users Only**
- Non-activated users cannot reset passwords
- Backend returns generic message regardless of account status
- **Benefit**: Prevents abuse of password reset flow

### 5. **Rate Limiting** (Redis-backed — Production Ready)
```
- Login:          5 attempts per 15 minutes  (per email or IP)
- OTP Request:    3 attempts per hour         (per email or IP)
- Password Reset: 3 attempts per hour         (per email or IP)
```
- Uses `ioredis` with atomic `INCR` + `PEXPIRE` commands.
- Fails **open** — if Redis is unavailable, users can still log in (availability over security for this tier).
- **Location**: `apps/api/src/middleware/rateLimiter.js`

### 6. **Account Lockout** (Redis-backed — Production Ready)
- **Trigger**: 5 consecutive failed password attempts
- **Duration**: 30 minutes
- **Implementation**: A `lockout:{email}` key is set in Redis with a 30-minute TTL (`PX 1800000`). The key expires automatically.
- **No lockout extension**: Additional failed attempts while locked do NOT reset the 30-minute clock.
- **Auto-clear**: On successful login, both the `failed_logins:{email}` and `lockout:{email}` keys are deleted from Redis.

### 7. **Correct Middleware Ordering** (Bug Fix)
- **Issue**: When both the 15-minute rate limit AND the 30-minute account lockout triggered simultaneously, users were shown the wrong (shorter) countdown timer.
- **Fix**: `checkAccountLockout()` now runs **before** `rateLimit("login")` in `authRoutes.js`.
- **Result**: A locked-out user is always shown the 30-minute lockout screen, not the 15-minute rate-limit screen.

### 8. **Failed Login Tracking**
- Tracks consecutive failed attempts per email in Redis (`failed_logins:{email}` key)
- Logs IP address for all login attempts
- Counter auto-expires after 1 hour if lockout threshold is not reached
- Clears on successful login
- **Benefit**: Enables fraud detection and alerting

### 9. **Secure Password Storage**
- Bcrypt hashing via PostgreSQL's `pgcrypto` extension (`gen_salt('bf')`)
- Passwords never stored or logged in plaintext

### 10. **OTP Security** (Redis-backed — Production Ready)
- 6-digit OTPs generated with `crypto.randomInt()` (cryptographically secure)
- 15-minute expiration enforced natively by Redis TTL (`EX 900`)
- Single-use: after verification, Redis key is set to value `"consumed"` (with `KEEPTTL`) so the expiration window is preserved but the OTP hash is destroyed
- After password is set, the consumed key is permanently deleted from Redis (`DEL`)
- **No database tables**: `activation_codes` and `password_resets` are no longer needed for OTP state; Redis handles it entirely

### 11. **OTP Bypass Prevention**
- `handleSetPassword` (account activation) verifies that the Redis key status is `"consumed"` before allowing a password to be set.
- `handleSetNewPassword` (password reset) re-checks that the Redis key status is `"consumed"` before updating the password.
- **Benefit**: An attacker cannot skip the OTP step and set a password directly via API.

### 12. **Atomic Database Transactions**
- `handleSetNewPassword`: Password update + refresh token revocation wrapped in a single `BEGIN`/`COMMIT` transaction.
- `handleChangePassword`: Same transactional guarantee.
- **Benefit**: No partial state can be left in the database if the server crashes mid-operation.

### 13. **Refresh Token Revocation on Password Change**
- All active refresh tokens are revoked in the same transaction as any password change or reset.
- **Benefit**: Forces re-login on all devices immediately after a password change, invalidating any potentially stolen tokens.

### 14. **Cryptographically Secure OTP Generation**
- OTPs use `crypto.randomInt(100000, 1000000)` instead of `Math.random()`.
- **Benefit**: Output is unpredictable and cannot be guessed from prior outputs.

### 15. **JWT Secret Startup Guard**
- Server crashes at startup in `production` if `JWT_SECRET` is not set in environment variables.
- **Benefit**: Prevents deployment with the hardcoded development fallback secret.

### 16. **CORS Allow-list**
- `server.js` uses an explicit origin-checking function instead of the wildcard `*`.
- Only whitelisted origins receive `Access-Control-Allow-Origin` headers.

### 17. **Comprehensive Logging**
All security events logged via `winston`:
- ✅ Login attempts (success/failure) with IP address
- ✅ OTP generation and verification
- ✅ Password reset requests
- ✅ Account lockouts triggered and cleared
- ✅ Rate limit violations
- ✅ Redis connection errors (fail-open events)

---

## 📋 TODO: Future Security Enhancements

### 1. **Integrate Sentry for Monitoring** (High Priority)
**Current**: Logging to `winston` / console only
**Required**: Send critical events to Sentry
```javascript
// TODO: npm install @sentry/node
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });

// After 3 failed login attempts:
Sentry.captureMessage(`Multiple failed login attempts for ${email}`, 'warning');
```

### 2. **Implement Email Delivery Service** (High Priority)
**Current**: OTPs printed to console (`[MOCK DELIVERY]`)
**Required**: Send actual emails via a transactional email provider
```javascript
// TODO: npm install @sendgrid/mail
async function sendOTPEmail(email, otp) {
  await sgMail.send({
    to: email,
    from: 'noreply@fresherhub.ashesi.edu.gh',
    subject: 'Your Fresher Hub Verification Code',
    html: `<p>Your code is: <strong>${otp}</strong>. It expires in 15 minutes.</p>`
  });
}
// Replace console.log in authService.js with actual delivery
```

### 3. **Implement CAPTCHA** (Medium Priority)
**Trigger**: After 3 failed login attempts
**Required**: Add CAPTCHA challenge to login form
```javascript
// TODO: npm install @hcaptcha/react-hcaptcha (mobile) / hcaptcha (api)
// Show CAPTCHA on login.tsx after 3 failed attempts
// Verify token server-side before processing login
```

### 4. **IP-Based Rate Limiting** (Medium Priority)
**Current**: Rate limiting currently falls back to IP when no email is present, but the primary key is email. A targeted credential-stuffing attack against many different emails from one IP is not stopped.
**Required**: Add a secondary global per-IP rate limiter.

### 5. **Device Fingerprinting** (Low Priority)
```javascript
// TODO: Detect suspicious logins from unrecognized devices
// Send email notification for new logins from new IPs/devices
```

### 6. **JWT Access Token Blacklisting** (Low Priority)
**Current**: Refresh tokens revoked on logout; access tokens (15 min) are valid until they expire.
**Required**: For immediate invalidation, use Redis to blacklist access tokens.
```javascript
// On logout: await redis.set(`blacklist:${hashToken(accessToken)}`, '1', 'EX', remainingTtl);
// On every authenticated request: check redis.exists(`blacklist:...`)
```

### 7. **Email Notifications for Security Events** (Medium Priority)
```javascript
// TODO: Send emails for:
// - Welcome on first successful account activation
// - Password change confirmation
// - Account lockout notification
// - Login from a new device/IP
```

### 8. **Admin Monitoring Dashboard** (Low Priority)
```javascript
// TODO: Protected endpoint: GET /api/admin/auth/metrics
// Return: failed logins (24h), locked accounts, top attacker IPs, etc.
```

---

## 🔒 Security Best Practices (Current Status)

### Password Policy
- ✅ Minimum 6 characters (Zod validation)
- ⚠️ TODO: Consider increasing minimum to 8 characters
- ⚠️ TODO: Add password strength validation (uppercase, number, special char)
- ⚠️ TODO: Check against breached password databases (HaveIBeenPwned API)

### Session Management
- ✅ JWT access tokens with 15-minute expiry
- ✅ Refresh tokens with 90-day expiry stored as SHA-256 hash in PostgreSQL
- ✅ Refresh tokens revoked on logout
- ✅ All refresh tokens revoked on password change/reset
- ✅ Only one active refresh token per user at a time (old ones revoked on new login)
- ⚠️ TODO: Implement access token blacklisting for immediate logout

### Input Validation
- ✅ Zod validation schemas on every route (`apps/api/src/schemas/authSchemas.js`)
- ✅ Email format validation
- ✅ Password minimum length
- ✅ SQL injection prevention via parameterized queries (`pg` library)
- ⚠️ TODO: Add XSS prevention headers (`helmet` package)

### HTTPS & Headers
- ⚠️ TODO: Enforce HTTPS in production
- ⚠️ TODO: Add HSTS, X-Frame-Options, X-Content-Type-Options headers (`helmet`)
- ⚠️ TODO: Use HttpOnly + Secure cookies for refresh tokens (instead of request body)

### CORS
- ✅ Explicit origin allow-list in `server.js` (no wildcard `*`)
- ⚠️ TODO: Ensure production server hostnames are added to the allow-list

### Redis
- ✅ Used for: rate limiting, account lockout, OTP storage
- ✅ Running locally on `localhost:6379` for development
- ⚠️ TODO: Set up Redis with password authentication (`requirepass`) in production
- ⚠️ TODO: Use `REDIS_URL` environment variable pointing to production Redis instance (e.g., Upstash, Redis Cloud)

---

## 🚨 Security Incident Response

### If Rate Limits Are Being Hit:
1. Check `winston` logs for the flagged email / IP
2. Verify if it's legitimate traffic or an attack pattern
3. Inspect Redis keys: `redis-cli keys "ratelimit:*"` to see active windows
4. Block malicious IPs at the load balancer / reverse proxy level if needed

### If Account Lockouts Are Spiking:
1. Check if users are forgetting passwords (send a "Forgot Password?" prompt)
2. Look for coordinated attacks against a list of known student emails
3. Inspect Redis: `redis-cli keys "lockout:*"` to see all currently locked accounts

### If OTP Brute Force Is Detected:
1. OTPs are already single-use and hashed — brute force is rate-limited by the `otpRequest` limiter (3/hour)
2. Consider reducing OTP validity to 10 minutes (change `EX 900` to `EX 600` in `authService.js`)
3. Consider increasing OTP length from 6 to 8 digits

---

## 📊 Monitoring Checklist

### Daily:
- [ ] Review `[WARN]` entries in server logs for failed logins and rate limit hits
- [ ] Check for account lockouts (`redis-cli keys "lockout:*"`)
- [ ] Monitor Redis memory usage (`redis-cli info memory`)

### Weekly:
- [ ] Audit password reset request volumes
- [ ] Check for suspicious IP patterns in logs
- [ ] Review any validation errors (400s) for unexpected attack patterns

### Monthly:
- [ ] Update `npm` dependencies (`npm audit` + `npm update`)
- [ ] Rotate `JWT_SECRET` and `REFRESH_SECRET` if applicable
- [ ] Test incident response procedures against staging environment

---

## 🏗️ Architecture Summary

| Concern | Technology | Notes |
|---|---|---|
| Permanent user data | **PostgreSQL** | Users, credentials, refresh tokens, posts |
| Rate limiting | **Redis** | Per email/IP, per action, per window |
| Account lockout | **Redis** | TTL-based, no DB writes needed |
| OTP storage | **Redis** | 15-min TTL, auto-deleted on use |
| Password hashing | **pgcrypto** (`bcrypt`) | Done inside the database |
| JWT signing | **HS256 / `crypto`** | Custom implementation, secret from env |
| Input validation | **Zod** | Schema-per-route in `authSchemas.js` |
| Structured logging | **winston** | All security events captured |

---

## 🔗 Resources

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Redis Security Documentation](https://redis.io/docs/management/security/)
- [ioredis Documentation](https://github.com/luin/ioredis)
- [Zod Documentation](https://zod.dev/)
- [SendGrid Documentation](https://docs.sendgrid.com/)

---

## 📝 Notes

- OTPs are no longer stored in PostgreSQL — the `activation_codes` and `password_resets` tables can be safely dropped from the schema once this is confirmed in production.
- Email delivery must be implemented before production (`[MOCK DELIVERY]` currently prints OTPs to server logs).
- Sentry integration is critical for production monitoring.
- Redis must be secured with a password in production (`requirepass` config).
- Regular security audits recommended quarterly.

**Last Updated**: 2026-07-20
**Version**: 2.0.0