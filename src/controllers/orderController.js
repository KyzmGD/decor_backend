const {
  Order,
  OrderItem,
  Product,
  User
} = require("../models");
const sequelize = require("../config/db");

const STATUS_TRANSITIONS = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Preparing", "Cancelled"],
  Preparing: ["Shipping", "Cancelled"],
  Shipping: ["Delivered"],
  Delivered: [],
  Completed: [],
  Cancelled: []
};

async function restoreInventory(order, transaction) {
  if (!order.stockConfirmed) {
    return;
  }

  const items = order.OrderItems || [];

  for (const item of items) {
    const product = await Product.findByPk(
      item.ProductId,
      {
        transaction,
        lock: transaction.LOCK.UPDATE
      }
    );

    if (product) {
      await product.increment(
        "stock",
        {
          by: Number(item.quantity),
          transaction
        }
      );
    }
  }
}

exports.createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      items,
      address,
      phone,
      recipientName,
      shippingMethod,
      paymentMethod,
      couponCode,
      note
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Order must contain at least one product"
      });
    }

    const products = [];
    const productMap = new Map();

    for (const item of items) {
      const product = await Product.findByPk(
        item.id,
        {
          transaction,
          lock: transaction.LOCK.UPDATE
        }
      );

      if (!product) {
        await transaction.rollback();
        return res.status(400).json({
          message: "One or more products were not found"
        });
      }

      const quantity = Number(item.quantity);
      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        Number(product.stock) < quantity
      ) {
        await transaction.rollback();
        return res.status(409).json({
          message: `Insufficient stock for ${product.name}`
        });
      }

      products.push(product);
      productMap.set(Number(product.id), product);
    }

    const autoConfirmed = products.every(
      (product) => Number(product.stock) > 5
    );
    const subtotal = items.reduce(
      (sum, item) => {
        const product = productMap.get(Number(item.id));
        return (
          sum +
          Number(product.price) * Number(item.quantity)
        );
      },
      0
    );
    const validatedShippingMethod =
      shippingMethod === "EXPRESS"
        ? "EXPRESS"
        : "STANDARD";
    const validatedShippingFee =
      validatedShippingMethod === "EXPRESS" ? 15 : 0;
    const validatedDiscount =
      String(couponCode || "").toUpperCase() === "WOODORA10"
        ? subtotal * 0.1
        : 0;

    const order = await Order.create(
      {
        totalPrice:
          subtotal -
          validatedDiscount +
          validatedShippingFee,
        address,
        phone,
        recipientName,
        shippingMethod: validatedShippingMethod,
        paymentMethod:
          paymentMethod === "BANK_TRANSFER"
            ? "BANK_TRANSFER"
            : "COD",
        shippingFee: validatedShippingFee,
        discount: validatedDiscount,
        note: note || null,
        UserId: req.user.id,
        status: autoConfirmed ? "Confirmed" : "Pending",
        requiresStockConfirmation: !autoConfirmed,
        stockConfirmed: autoConfirmed,
        stockConfirmedAt: autoConfirmed ? new Date() : null,
        confirmedAt: autoConfirmed ? new Date() : null
      },
      { transaction }
    );

    for (const item of items) {
      const product = productMap.get(Number(item.id));

      await OrderItem.create(
        {
          OrderId: order.id,
          ProductId: item.id,
          quantity: Number(item.quantity),
          price: product.price
        },
        { transaction }
      );

      if (autoConfirmed) {
        await product.decrement(
          "stock",
          {
            by: Number(item.quantity),
            transaction
          }
        );
      }
    }

    await transaction.commit();
    return res.status(201).json(order);
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: error.message
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: {
        UserId: req.user.id
      },
      include: [
        {
          model: OrderItem,
          include: [Product]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: User,
          attributes: {
            exclude: ["password"]
          }
        },
        {
          model: OrderItem,
          include: [Product]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findByPk(
      req.params.id,
      {
        include: [OrderItem],
        transaction,
        lock: transaction.LOCK.UPDATE
      }
    );

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Order not found"
      });
    }

    const nextStatus = req.body.status;
    const allowedStatuses =
      STATUS_TRANSITIONS[order.status] || [];

    if (!allowedStatuses.includes(nextStatus)) {
      await transaction.rollback();
      return res.status(409).json({
        message: `Cannot change order from ${order.status} to ${nextStatus}`
      });
    }

    if (
      nextStatus === "Confirmed" &&
      order.requiresStockConfirmation &&
      !order.stockConfirmed
    ) {
      await transaction.rollback();
      return res.status(409).json({
        message: "This order requires stock confirmation first",
        code: "STOCK_CONFIRMATION_REQUIRED"
      });
    }

    if (nextStatus === "Cancelled") {
      await restoreInventory(order, transaction);
    }

    const statusTimestamps = {};

    if (nextStatus === "Confirmed") {
      statusTimestamps.confirmedAt = new Date();
    }

    if (nextStatus === "Shipping") {
      statusTimestamps.shippingStartedAt = new Date();
    }

    if (nextStatus === "Delivered") {
      statusTimestamps.deliveredAt = new Date();
    }

    await order.update(
      {
        status: nextStatus,
        ...statusTimestamps,
        ...(nextStatus === "Cancelled"
          ? {
              stockConfirmed: false,
              stockConfirmedAt: null
            }
          : {})
      },
      { transaction }
    );

    await transaction.commit();
    return res.json(order);
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: error.message
    });
  }
};

exports.confirmLowStockOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findByPk(
      req.params.id,
      {
        include: [OrderItem],
        transaction,
        lock: transaction.LOCK.UPDATE
      }
    );

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (
      order.status !== "Pending" ||
      !order.requiresStockConfirmation ||
      order.stockConfirmed
    ) {
      await transaction.rollback();
      return res.status(409).json({
        message: "Order is not awaiting stock confirmation"
      });
    }

    for (const item of order.OrderItems || []) {
      const product = await Product.findByPk(
        item.ProductId,
        {
          transaction,
          lock: transaction.LOCK.UPDATE
        }
      );

      if (
        !product ||
        Number(product.stock) < Number(item.quantity)
      ) {
        await transaction.rollback();
        return res.status(409).json({
          message: `Insufficient stock for ${product?.name || item.ProductId}`
        });
      }

      await product.decrement(
        "stock",
        {
          by: Number(item.quantity),
          transaction
        }
      );
    }

    await order.update(
      {
        stockConfirmed: true,
        stockConfirmedAt: new Date(),
        confirmedAt: new Date(),
        status: "Confirmed"
      },
      { transaction }
    );

    await transaction.commit();
    return res.json(order);
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: error.message
    });
  }
};

exports.cancelMyOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findOne({
      where: {
        id: req.params.id,
        UserId: req.user.id
      },
      include: [OrderItem],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (
      !["Pending", "Confirmed", "Preparing"].includes(order.status)
    ) {
      await transaction.rollback();
      return res.status(409).json({
        message: "This order can no longer be cancelled"
      });
    }

    await restoreInventory(order, transaction);
    await order.update(
      {
        status: "Cancelled",
        stockConfirmed: false,
        stockConfirmedAt: null
      },
      { transaction }
    );

    await transaction.commit();
    return res.json(order);
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: error.message
    });
  }
};

exports.confirmOrderReceived = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: {
        id: req.params.id,
        UserId: req.user.id
      }
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (order.status !== "Delivered") {
      return res.status(409).json({
        message: "Only delivered orders can be completed"
      });
    }

    await order.update({
      status: "Completed"
    });

    return res.json(order);
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};
