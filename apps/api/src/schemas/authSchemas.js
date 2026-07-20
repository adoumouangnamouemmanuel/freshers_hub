/**
 * Zod request-body validators for authentication-related endpoints.
 *
 * Each `*Schema` validates the expected `req.body` shape for its corresponding
 * controller route, enforcing basic constraints (e.g., email format, password length).
 */

const { z } = require("zod");

// Validate login credentials.
const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

// Validate account activation (email + OTP + new password).
const activateSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    otp: z.string().min(4, "OTP is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

// Validate token refresh request (expects a refreshToken).
const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

// Validate request to send an OTP (email only).
const requestOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format").min(1, "Email is required"),
  }),
});

// Validate forgot-password request (email only).
const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format").min(1, "Email is required"),
  }),
});

// Validate password reset (email + reset token + new password).
const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    otp: z.string().min(4, "OTP is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
  }),
});

// Validate email check/verification request (email only).
const checkEmailSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format").min(1, "Email is required"),
  }),
});

// Validate OTP verification (email + otp).
const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    otp: z.string().min(4, "OTP is required"),
  }),
});

// Validate set-password request (email + new password).
const setPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

// Validate change-password request (current password + new password).
const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
  }),
});

// Validate profile update (optional fields).
const updateProfileSchema = z.object({
  body: z.object({
    phone: z.string().optional(),
    major: z.string().optional(),
    avatarUrl: z.string().optional(),
  }),
});

module.exports = {
  loginSchema,
  activateSchema,
  refreshSchema,
  requestOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  checkEmailSchema,
  verifyOtpSchema,
  setPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
};
