const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const postRoutes = require("./src/routes/postRoutes");
const faqRoutes = require("./src/routes/faqRoutes");
const groupRoutes = require("./src/routes/groupRoutes");
const eventRoutes = require("./src/routes/eventRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const supportRoutes = require("./src/routes/supportRoutes");
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

app.use(cors());
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
    ],
  });
});

// Global error handler
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Fresher Hub API (Express) listening on http://localhost:${port}`);
});
