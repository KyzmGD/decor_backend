const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
} = require("../controllers/wishlistController");

router.get("/", protect, getWishlist);
router.post("/", protect, addToWishlist);
router.delete("/:productId", protect, removeFromWishlist);
router.delete("/", protect, clearWishlist);

module.exports = router;
