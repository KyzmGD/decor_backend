const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CartItem = sequelize.define("CartItem", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 1 }
  }
}, {
  tableName: "CartItems",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["userId", "productId"]
    }
  ]
});

module.exports = CartItem;
