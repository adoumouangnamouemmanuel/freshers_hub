const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { handleGetGroups, handleGetMyGroups } = require("../controllers/groupController");

const router = express.Router();

router.get("/", handleGetGroups);
router.get("/my", requireAuth, handleGetMyGroups);

module.exports = router;
