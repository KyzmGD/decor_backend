const express = require("express");

const router = express.Router();

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require(
  "../controllers/productController"
);

const protect =
  require("../middleware/authMiddleware");

const admin =
  require("../middleware/adminMiddleware");

const {
  getReviews,
  createReview
} = require("../controllers/reviewController");

router.get("/", getProducts);

router.get("/:id", getProductById);

router.post(
  "/",
  protect,
  admin,
  createProduct
);

router.put(
  "/:id",
  protect,
  admin,
  updateProduct
);

router.delete(
  "/:id",
  protect,
  admin,
  deleteProduct
);

// Review routes
router.get("/:id/reviews", getReviews);
router.post("/:id/reviews", protect, createReview);

module.exports = router;