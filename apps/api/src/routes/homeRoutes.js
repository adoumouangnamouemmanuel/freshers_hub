const express = require("express");
const { getHomeDashboard } = require("../controllers/homeController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);

router.get("/dashboard", getHomeDashboard);

module.exports = router;
