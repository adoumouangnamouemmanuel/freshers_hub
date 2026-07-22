const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");
const { optionalAuth } = require("../middleware/authMiddleware");

// Route is publicly accessible since it's just campus locations
router.get("/", optionalAuth, locationController.getLocations);

module.exports = router;
