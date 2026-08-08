require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { DataTypes } = require("sequelize");
const {
  backfillProductImages
} = require("./scripts/backfillProductImages");
const backfillOrderStatusHistory =
  require("./scripts/backfillOrderStatusHistory");

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
app.use(express.json({ limit: "25mb" }));

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

const wishlistRoutes =
  require("./routes/wishlistRoutes");

const cartRoutes =
  require("./routes/cartRoutes");

const adminAccountRoutes =
  require("./routes/adminAccountRoutes");

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

app.use(
  "/api/wishlist",
  wishlistRoutes
);

app.use(
  "/api/cart",
  cartRoutes
);

app.use(
  "/api/admin/accounts",
  adminAccountRoutes
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

  if (!userColumns.lastLoginAt) {
    await queryInterface.addColumn(
      "Users",
      "lastLoginAt",
      {
        type: DataTypes.DATE,
        allowNull: true
      }
    );
  }

  const productColumns =
    await queryInterface.describeTable("Products");

  if (!productColumns.images) {
    await queryInterface.addColumn(
      "Products",
      "images",
      {
        type: DataTypes.JSON,
        allowNull: true
      }
    );
  }

  if (
    productColumns.image &&
    !String(productColumns.image.type)
      .toUpperCase()
      .includes("TEXT")
  ) {
    await queryInterface.changeColumn(
      "Products",
      "image",
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
  .then(backfillOrderStatusHistory)
  .then(backfillProductImages)
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
