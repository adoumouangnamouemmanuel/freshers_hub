const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const postRoutes = require("./src/routes/postRoutes");
const faqRoutes = require("./src/routes/faqRoutes");
const groupRoutes = require("./src/routes/groupRoutes");
const eventRoutes = require("./src/routes/eventRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");

const app = express();
const port = Number(process.env.PORT || 4000);

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Listen for when the response finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLine = `[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    
    // Log colors based on status code
    if (res.statusCode >= 500) {
      console.error(`\x1b[31m${logLine}\x1b[0m`); // Red for server errors
    } else if (res.statusCode >= 400) {
      console.warn(`\x1b[33m${logLine}\x1b[0m`); // Yellow for client errors
    } else {
      console.log(`\x1b[32m${logLine}\x1b[0m`); // Green for success
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
app.use((err, req, res, next) => {
  console.error("\x1b[31m[Server Error]\x1b[0m", err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(port, () => {
  console.log(`Fresher Hub API (Express) listening on http://localhost:${port}`);
});
