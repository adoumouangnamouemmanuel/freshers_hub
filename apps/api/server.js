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

app.listen(port, () => {
  console.log(`Fresher Hub API (Express) listening on http://localhost:${port}`);
});
