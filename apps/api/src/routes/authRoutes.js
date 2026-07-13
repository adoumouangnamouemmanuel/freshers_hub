const express = require("express");
const { handleLogin, handleActivate, handleRefresh } = require("../controllers/authController");

const router = express.Router();

router.post("/login", handleLogin);
router.post("/activate", handleActivate);
router.post("/refresh", handleRefresh);

module.exports = router;
