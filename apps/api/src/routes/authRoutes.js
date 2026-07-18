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
} = require("../controllers/authController");
const validate = require("../middleware/validate");
const { rateLimit } = require("../middleware/rateLimiter");
const {
  loginSchema,
  refreshSchema,
  requestOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  checkEmailSchema,
  verifyOtpSchema,
  setPasswordSchema
} = require("../schemas/authSchemas");

const router = express.Router();

router.post("/login", validate(loginSchema), rateLimit("login"), handleLogin);
router.post("/refresh", validate(refreshSchema), handleRefresh);
router.post("/request-otp", validate(requestOtpSchema), rateLimit("otpRequest"), handleRequestOtp);
router.post("/forgot-password", validate(forgotPasswordSchema), rateLimit("passwordReset"), handleForgotPassword);
router.post("/verify-reset-otp", validate(verifyOtpSchema), handleVerifyResetOtp);
router.post("/set-new-password", validate(setPasswordSchema), handleSetNewPassword);
router.post("/logout", handleLogout);
router.post("/check-email", validate(checkEmailSchema), handleCheckEmail);
router.post("/verify-otp", validate(verifyOtpSchema), handleVerifyOtp);
router.post("/set-password", validate(setPasswordSchema), handleSetPassword);

module.exports = router;
