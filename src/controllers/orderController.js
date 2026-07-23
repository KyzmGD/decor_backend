const {
  Order,
  OrderItem,
    Product,
  User
} = require("../models");
const sequelize = require("../config/db");

exports.createOrder =
  async (req, res) => {

    try {

      const {
        items,
        address,
        phone,
        recipientName,
        shippingMethod,
        paymentMethod,
        shippingFee,
        couponCode,
        note
      } = req.body;

      const productIds = items.map(
        (item) => item.id
      );
      const products = await Product.findAll({
        where: { id: productIds }
      });
      const productMap = new Map(
        products.map((product) => [
          Number(product.id),
          product
        ])
      );

      if (products.length !== productIds.length) {
        return res.status(400).json({
          message: "One or more products were not found"
        });
      }

      for (const item of items) {
        const product = productMap.get(Number(item.id));
        if (
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) < 1 ||
          Number(product.stock) < Number(item.quantity)
        ) {
          return res.status(409).json({
            message: `Insufficient stock for ${product.name}`
          });
        }
      }

      const requiresStockConfirmation =
        products.some(
          (product) => Number(product.stock) < 4
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
        validatedShippingMethod === "EXPRESS"
          ? 15
          : 0;
      const validatedDiscount =
        String(couponCode || "").toUpperCase() === "WOODORA10"
          ? subtotal * 0.1
          : 0;
      const calculatedTotal =
        subtotal -
        validatedDiscount +
        validatedShippingFee;

      const order =
        await Order.create({
          totalPrice: calculatedTotal,
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
          requiresStockConfirmation
        });

      await Promise.all(
        items.map(item =>
          OrderItem.create({
            OrderId: order.id,
            ProductId: item.id,
            quantity: item.quantity,
            price: productMap.get(Number(item.id)).price
          })
        )
      );

      res.status(201).json(order);

    } catch (error) {

      res.status(500).json({
        message: error.message
      });

    }
};

exports.getMyOrders =
  async (req, res) => {

    try {

      const orders =
        await Order.findAll({

          where: {
            UserId:
              req.user.id
          },

          include: [
            {
              model:
                OrderItem,
              include: [
                Product
              ]
            }
          ],

          order: [
            ["createdAt", "DESC"]
          ]

        });

      res.json(
        orders
      );

    } catch (error) {

      res.status(500).json({
        message:
          error.message
      });

    }
};

exports.getAllOrders =
  async (req, res) => {

    try {

      const orders =
        await Order.findAll({

          include: [

            User,

            {
              model:
                OrderItem,
              include: [
                Product
              ]
            }

          ],

          order: [
            ["createdAt", "DESC"]
          ]

        });

      res.json(
        orders
      );

    } catch (error) {

      res.status(500).json({
        message:
          error.message
      });

    }
};

exports.updateOrderStatus =
  async (req, res) => {

    try {

      const order =
        await Order.findByPk(
          req.params.id
        );

      if (!order) {

        return res
          .status(404)
          .json({
            message:
              "Order not found"
          });
      }

      const nextStatus = req.body.status;
      const validStatuses = [
        "Pending",
        "Processing",
        "Shipping",
        "Completed",
        "Cancelled"
      ];

      if (!validStatuses.includes(nextStatus)) {
        return res.status(400).json({
          message: "Invalid order status"
        });
      }

      if (
        order.requiresStockConfirmation &&
        !order.stockConfirmed &&
        !["Pending", "Cancelled"].includes(nextStatus)
      ) {
        return res.status(409).json({
          message: "Low stock order requires confirmation first",
          code: "LOW_STOCK_CONFIRMATION_REQUIRED"
        });
      }

      await order.update({
        status: nextStatus
      });

      res.json(order);

    } catch (error) {

      res.status(500).json({
        message:
          error.message
      });

    }
};

exports.confirmLowStockOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findByPk(
      req.params.id,
      {
        include: [
          {
            model: OrderItem,
            include: [Product]
          }
        ],
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

    if (!order.requiresStockConfirmation) {
      await transaction.rollback();
      return res.status(400).json({
        message: "This order does not require low stock confirmation"
      });
    }

    if (order.stockConfirmed) {
      await transaction.rollback();
      return res.status(409).json({
        message: "Order stock has already been confirmed"
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
    }

    await order.update(
      {
        stockConfirmed: true,
        stockConfirmedAt: new Date(),
        status: "Processing"
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
