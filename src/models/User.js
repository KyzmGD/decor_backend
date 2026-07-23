const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  fullname: {
    type: DataTypes.STRING,
    allowNull: false
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false
  },

  role: {
    type: DataTypes.ENUM("user", "admin"),
    defaultValue: "user"
  },

  gender: {
    type: DataTypes.ENUM(
      "male",
      "female",
      "other"
    ),
    allowNull: true
  },

  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },

  city: {
    type: DataTypes.STRING,
    allowNull: true
  },

  district: {
    type: DataTypes.STRING,
    allowNull: true
  },

  address: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = User;
