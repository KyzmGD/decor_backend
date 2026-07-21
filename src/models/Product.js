const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Product = sequelize.define(
  "Product",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    description: {
      type: DataTypes.TEXT
    },

    price: {
      type: DataTypes.FLOAT,
      allowNull: false
    },

    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    image: {
      type: DataTypes.STRING
    },

    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }
);

module.exports = Product;