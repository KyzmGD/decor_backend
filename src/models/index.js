const User = require("./User");
const Product = require("./Product");
const Category = require("./Category");
const Order = require("./Order");
const OrderItem = require("./OrderItem");

User.hasMany(Order);

Order.belongsTo(User);

Order.hasMany(OrderItem);

OrderItem.belongsTo(Order);

Product.hasMany(OrderItem);

OrderItem.belongsTo(Product);
Category.hasMany(Product, {
  foreignKey: "categoryId"
});

Product.belongsTo(Category, {
  foreignKey: "categoryId"
});

module.exports = {
  User,
  Product,
  Category,
  Order,
  OrderItem
};