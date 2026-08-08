const express = require("express");
const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const {
  getAccounts,
  getAccount,
  updateAccountRole
} = require("../controllers/adminAccountController");

const router = express.Router();

router.use(protect, admin);
router.get("/", getAccounts);
router.get("/:id", getAccount);
router.patch("/:id/role", updateAccountRole);

module.exports = router;
