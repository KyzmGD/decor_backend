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
      "Confirmed",
      "Preparing",
      "Shipping",
      "Delivered",
      "Completed",
      "Cancelled"
    ),
    defaultValue: "Pending"
  },

  requiresStockConfirmation: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },

  stockConfirmed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },

  stockConfirmedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  shippingStartedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  address: {
    type: DataTypes.STRING,
    allowNull: false
  },

  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },

  recipientName: {
    type: DataTypes.STRING,
    allowNull: true
  },

  shippingMethod: {
    type: DataTypes.ENUM(
      "STANDARD",
      "EXPRESS"
    ),
    allowNull: false,
    defaultValue: "STANDARD"
  },

  paymentMethod: {
    type: DataTypes.ENUM(
      "COD",
      "BANK_TRANSFER"
    ),
    allowNull: false,
    defaultValue: "COD"
  },

  paymentStatus: {
    type: DataTypes.ENUM(
      "NOT_REQUIRED",
      "PENDING",
      "PAID",
      "FAILED",
      "CANCELLED",
      "REFUNDED"
    ),
    allowNull: false,
    defaultValue: "NOT_REQUIRED"
  },

  paymentPaidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  shippingFee: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },

  discount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },

  note: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Order;
