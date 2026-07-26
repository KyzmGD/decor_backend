const express = require("express");

const protect = require("../middleware/authMiddleware");
const {
  createReview,
  getReviews
} = require("../controllers/reviewController");

const router = express.Router();

router.get("/:id/reviews", getReviews);
router.post("/:id/reviews", protect, createReview);

module.exports = router;
