const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { handleGetGroups, handleGetMyGroups, handleGetGroupById } = require("../controllers/groupController");

const router = express.Router();

router.get("/", handleGetGroups);
router.get("/my", requireAuth, handleGetMyGroups);
router.get("/:id", handleGetGroupById);

module.exports = router;
