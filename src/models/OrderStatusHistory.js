const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const OrderStatusHistory = sequelize.define(
  "OrderStatusHistory",
  {
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
      allowNull: false
    },
    changedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  { timestamps: false }
);

module.exports = OrderStatusHistory;
