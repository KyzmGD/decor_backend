require("dotenv").config();

const cors = require("cors");
const express = require("express");
const sequelize = require("./config/db");

require("./models");

const adminAccountRoutes = require("./routes/adminAccountRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const productRoutes = require("./routes/productRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const runStartupTasks = require("./scripts/runStartupTasks");

const app = express();
const port = Number(process.env.PORT) || 5000;
const allowedOrigins = [
  "http://localhost:5173",
  "https://decor-frontend-pi.vercel.app",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "25mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin/accounts", adminAccountRoutes);

const startServer = async () => {
  await sequelize.sync();
  await runStartupTasks();

  return app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
