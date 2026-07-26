const User = require("./User");
const Product = require("./Product");
const Category = require("./Category");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Review = require("./Review");

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

// Review associations
User.hasMany(Review, { foreignKey: "userId" });
Review.belongsTo(User, { foreignKey: "userId" });
Product.hasMany(Review, { foreignKey: "productId" });
Review.belongsTo(Product, { foreignKey: "productId" });

module.exports = {
  User,
  Product,
  Category,
  Order,
  OrderItem,
  Review
};