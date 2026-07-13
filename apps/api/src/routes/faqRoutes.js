const express = require("express");
const { handleFaqSearch } = require("../controllers/faqController");

const router = express.Router();

router.get("/search", handleFaqSearch);

module.exports = router;
