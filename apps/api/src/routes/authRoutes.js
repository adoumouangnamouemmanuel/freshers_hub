const express = require("express");
const {
  handleLogin,
  handleActivate,
  handleRefresh,
  handleRequestOtp,
  handleForgotPassword,
  handleResetPassword,
  handleLogout,
  handleCheckEmail,
} = require("../controllers/authController");
const validate = require("../middleware/validate");
const {
  loginSchema,
  activateSchema,
  refreshSchema,
  requestOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  checkEmailSchema
} = require("../schemas/authSchemas");

const router = express.Router();

router.post("/login", validate(loginSchema), handleLogin);
router.post("/activate", validate(activateSchema), handleActivate);
router.post("/refresh", validate(refreshSchema), handleRefresh);
router.post("/request-otp", validate(requestOtpSchema), handleRequestOtp);
router.post("/forgot-password", validate(forgotPasswordSchema), handleForgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), handleResetPassword);
router.post("/logout", handleLogout);
router.post("/check-email", validate(checkEmailSchema), handleCheckEmail);

module.exports = router;
