const express = require("express");

const protect = require("../middleware/authMiddleware");
const {
  createReview,
  getReviews,
  deleteReview
} = require("../controllers/reviewController");

const router = express.Router();

router.get("/:id/reviews", getReviews);
router.post("/:id/reviews", protect, createReview);
router.delete("/:reviewId", protect, deleteReview);

module.exports = router;
