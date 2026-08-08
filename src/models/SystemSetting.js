const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SystemSetting = sequelize.define("SystemSetting", {
  key: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = SystemSetting;
