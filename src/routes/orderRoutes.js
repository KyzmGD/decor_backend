const express =
  require("express");

const router =
  express.Router();

const auth =
  require(
    "../middleware/authMiddleware"
  );

const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus
} = require(
  "../controllers/orderController"
);

router.post(
  "/",
  auth,
  createOrder
);

router.get(
  "/my-orders",
  auth,
  getMyOrders
);

router.get(
  "/",
  auth,
  getAllOrders
);

router.put(
  "/:id",
  auth,
  updateOrderStatus
);

module.exports = router;