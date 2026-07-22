const express = require("express");
const router = express.Router();
const helpController = require("../controllers/helpController");

router.get("/offices", helpController.getOffices);
router.get("/offices/:id", helpController.getOfficeById);

module.exports = router;
