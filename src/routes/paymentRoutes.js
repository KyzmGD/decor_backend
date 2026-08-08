const express = require("express");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const {
  confirmPaymentManually,
  getMyTransactions,
  handleSePayWebhook
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/sepay/webhook", handleSePayWebhook);
router.get("/my-transactions", auth, getMyTransactions);
router.patch("/:id/confirm", auth, admin, confirmPaymentManually);

module.exports = router;
