const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Order = sequelize.define("Order", {
  totalPrice: {
    type: DataTypes.FLOAT,
    allowNull: false
  },

  status: {
    type: DataTypes.ENUM(
      "Pending",
      "Processing",
      "Shipping",
      "Completed",
      "Cancelled"
    ),
    defaultValue: "Pending"
  },

  address: {
    type: DataTypes.STRING,
    allowNull: false
  },

  phone: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Order;