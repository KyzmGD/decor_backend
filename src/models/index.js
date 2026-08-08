const User = require("./User");
const Product = require("./Product");
const Category = require("./Category");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const OrderStatusHistory = require("./OrderStatusHistory");
const Review = require("./Review");
const Wishlist = require("./Wishlist");
const CartItem = require("./CartItem");

User.hasMany(Order);

Order.belongsTo(User);

Order.hasMany(OrderItem);

OrderItem.belongsTo(Order);

Order.hasMany(OrderStatusHistory, {
  as: "statusHistory",
  foreignKey: "orderId",
  onDelete: "CASCADE"
});

OrderStatusHistory.belongsTo(Order, {
  foreignKey: "orderId"
});

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

// Wishlist associations
User.hasMany(Wishlist, { foreignKey: "userId" });
Wishlist.belongsTo(User, { foreignKey: "userId" });
Product.hasMany(Wishlist, { foreignKey: "productId" });
Wishlist.belongsTo(Product, { foreignKey: "productId" });

// CartItem associations
User.hasMany(CartItem, { foreignKey: "userId" });
CartItem.belongsTo(User, { foreignKey: "userId" });
Product.hasMany(CartItem, { foreignKey: "productId" });
CartItem.belongsTo(Product, { foreignKey: "productId" });

module.exports = {
  User,
  Product,
  Category,
  Order,
  OrderItem,
  OrderStatusHistory,
  Review,
  Wishlist,
  CartItem
};
