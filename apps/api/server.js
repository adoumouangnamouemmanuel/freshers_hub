const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const postRoutes = require("./src/routes/postRoutes");
const faqRoutes = require("./src/routes/faqRoutes");
const groupRoutes = require("./src/routes/groupRoutes");
const eventRoutes = require("./src/routes/eventRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const supportRoutes = require("./src/routes/supportRoutes");
const searchRoutes = require("./src/routes/searchRoutes");
const locationRoutes = require("./src/routes/locationRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const logger = require("./src/utils/logger");
const errorHandler = require("./src/middleware/errorHandler");
const config = require("./src/config");

const app = express();
const port = config.port;

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLine = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    
    if (res.statusCode >= 500) {
      logger.error(logLine);
    } else if (res.statusCode >= 400) {
      logger.warn(logLine);
    } else {
      logger.info(logLine);
    }
  });
  
  next();
});

// FIX #6: Restrict CORS to an explicit allowed-origins list instead of using
// the open cors() default (which accepts all origins).
// In development: allow common localhost ports for the web admin and mobile metro.
// In production:  set ALLOWED_ORIGINS as a comma-separated list in your env.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://localhost:8081", "http://localhost:19006"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      logger.warn(`CORS rejected request from origin: ${origin}`);
      return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "fresher-hub-api" });
});

app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/faqs", faqRoutes);
app.use("/groups", groupRoutes);
app.use("/events", eventRoutes);
app.use("/notifications", notificationRoutes);
app.use("/support", supportRoutes);
app.use("/search", searchRoutes);
app.use("/locations", locationRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    routes: [
      "GET /health",
      "POST /auth/login",
      "POST /auth/activate",
      "POST /auth/refresh",
      "GET /faqs/search",
      "GET /posts",
      "POST /posts",
      "GET /groups",
      "GET /groups/my",
      "GET /events",
      "POST /events",
      "POST /events/:id/rsvp",
      "GET /notifications",
      "PATCH /notifications/:id/read",
      "PATCH /notifications/read-all",
      "GET /admin/users",
      "GET /admin/analytics/overview",
      "GET /admin/audit-log",
    ],
  });
});

// Global error handler
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Fresher Hub API (Express) listening on http://localhost:${port}`);
});
