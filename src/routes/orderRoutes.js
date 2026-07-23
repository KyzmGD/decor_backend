const express =
  require("express");

const router =
  express.Router();

const auth =
  require(
    "../middleware/authMiddleware"
  );
const admin =
  require(
    "../middleware/adminMiddleware"
  );

const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  confirmLowStockOrder
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
  admin,
  getAllOrders
);

router.patch(
  "/:id/confirm-stock",
  auth,
  admin,
  confirmLowStockOrder
);

router.put(
  "/:id",
  auth,
  admin,
  updateOrderStatus
);

module.exports = router;
