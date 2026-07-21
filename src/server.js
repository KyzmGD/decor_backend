require("dotenv").config();
const cors = require("cors");

app.use(cors());
const express = require("express");

const sequelize =
  require("./config/db");

require("./models");

const authRoutes =
  require("./routes/authRoutes");

const productRoutes =
  require("./routes/productRoutes");

const categoryRoutes =
  require("./routes/categoryRoutes");

const app = express();

const {
  Product,
  Category
} = require("./models");

app.use(cors());
app.use(express.json());

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

sequelize
  .sync({ alter: true })
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