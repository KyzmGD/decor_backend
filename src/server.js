require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { DataTypes } = require("sequelize");

const app = express();
const orderRoutes =
  require("./routes/orderRoutes");
const reviewRoutes =
  require("./routes/reviewRoutes");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://decor-frontend-pi.vercel.app"
    ],
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/reviews",
  reviewRoutes
);

const sequelize =
  require("./config/db");

require("./models");

const authRoutes =
  require("./routes/authRoutes");

const productRoutes =
  require("./routes/productRoutes");

const categoryRoutes =
  require("./routes/categoryRoutes");

const {
  Product,
  Category
} = require("./models");



app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/categories",
  categoryRoutes
);

const PORT =
  process.env.PORT || 5000;

const ensureSchemaColumns = async () => {
  const queryInterface =
    sequelize.getQueryInterface();
  const orderColumns =
    await queryInterface.describeTable("Orders");

  const timestampColumns = {
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    shippingStartedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  };

  for (const [name, definition] of Object.entries(
    timestampColumns
  )) {
    if (!orderColumns[name]) {
      await queryInterface.addColumn(
        "Orders",
        name,
        definition
      );
    }
  }

  const userColumns =
    await queryInterface.describeTable("Users");

  if (!userColumns.avatar) {
    await queryInterface.addColumn(
      "Users",
      "avatar",
      {
        type: DataTypes.TEXT("medium"),
        allowNull: true
      }
    );
  }
};

sequelize
  .sync()
  .then(ensureSchemaColumns)
  .then(() => {

    console.log(
      "MySQL Connected"
    );

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });

  })
  .catch(console.error);
