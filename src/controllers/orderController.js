const {
  Order,
  OrderItem,
    Product,
  User
} = require("../models");

exports.createOrder =
  async (req, res) => {

    try {

      const {
        items,
        totalPrice,
        address,
        phone
      } = req.body;

      const order =
        await Order.create({
          totalPrice,
          address,
          phone,
          UserId: req.user.id
        });

      await Promise.all(
        items.map(item =>
          OrderItem.create({
            OrderId: order.id,
            ProductId: item.id,
            quantity: item.quantity,
            price: item.price
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

      await order.update({
        status:
          req.body.status
      });

      res.json(order);

    } catch (error) {

      res.status(500).json({
        message:
          error.message
      });

    }
};