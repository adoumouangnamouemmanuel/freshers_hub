const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");
const auth = require("../middleware/authMiddleware"); // optional auth for RBAC

// Use auth.optionalAuth if search can be used by unauthenticated users, 
// or auth.requireAuth if it requires login. Since home screen search is usually for logged in users in this app:
router.get("/", auth.optionalAuth, searchController.globalSearch);

module.exports = router;
