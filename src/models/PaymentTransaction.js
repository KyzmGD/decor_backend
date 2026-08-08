const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PaymentTransaction = sequelize.define("PaymentTransaction", {
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  provider: {
    type: DataTypes.ENUM("BANK_TRANSFER", "SEPAY", "MANUAL"),
    allowNull: false,
    defaultValue: "BANK_TRANSFER"
  },

  providerTransactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },

  reference: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },

  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: "USD"
  },

  transferAmountVnd: {
    type: DataTypes.BIGINT,
    allowNull: false
  },

  exchangeRate: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },

  status: {
    type: DataTypes.ENUM(
      "PENDING",
      "PAID",
      "FAILED",
      "CANCELLED",
      "REFUNDED"
    ),
    allowNull: false,
    defaultValue: "PENDING"
  },

  bankName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  bankAccount: {
    type: DataTypes.STRING,
    allowNull: false
  },

  accountName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  qrCodeUrl: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  transferContent: {
    type: DataTypes.STRING,
    allowNull: false
  },

  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  rawPayload: {
    type: DataTypes.JSON,
    allowNull: true
  }
});

module.exports = PaymentTransaction;
