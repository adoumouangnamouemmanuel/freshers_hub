const express = require("express");
const {
  handleLogin,
  handleRefresh,
  handleRequestOtp,
  handleForgotPassword,
  handleLogout,
  handleCheckEmail,
  handleVerifyOtp,
  handleSetPassword,
  handleVerifyResetOtp,
  handleSetNewPassword,
  handleChangePassword,
  handleUpdateProfile,
} = require("../controllers/authController");
const validate = require("../middleware/validate");
const { rateLimit, checkAccountLockout } = require("../middleware/rateLimiter");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  loginSchema,
  refreshSchema,
  requestOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  checkEmailSchema,
  verifyOtpSchema,
  setPasswordSchema,
  changePasswordSchema,
  updateProfileSchema
} = require("../schemas/authSchemas");

const router = express.Router();

// FIX #1: checkAccountLockout is now proper Express middleware on this route.
// It correctly short-circuits before the controller runs, preventing the
// double-response crash that occurred when it was called manually inside handleLogin.
// 
// FIX: Placed checkAccountLockout BEFORE rateLimit. If a user is locked out (30 mins), 
// they should see that error first, rather than the rate limit error (15 mins) hiding it!
router.post("/login", validate(loginSchema), checkAccountLockout(), rateLimit("login"), handleLogin);
router.post("/refresh", validate(refreshSchema), handleRefresh);
router.post("/request-otp", validate(requestOtpSchema), rateLimit("otpRequest"), handleRequestOtp);
router.post("/forgot-password", validate(forgotPasswordSchema), rateLimit("passwordReset"), handleForgotPassword);
router.post("/verify-reset-otp", validate(verifyOtpSchema), handleVerifyResetOtp);
router.post("/set-new-password", validate(resetPasswordSchema), handleSetNewPassword);
router.post("/logout", handleLogout);
router.post("/check-email", validate(checkEmailSchema), handleCheckEmail);
router.post("/verify-otp", validate(verifyOtpSchema), handleVerifyOtp);
router.post("/set-password", validate(setPasswordSchema), handleSetPassword);
router.post("/change-password", requireAuth, validate(changePasswordSchema), handleChangePassword);
router.put("/profile", requireAuth, validate(updateProfileSchema), handleUpdateProfile);

module.exports = router;
