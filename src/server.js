require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();


app.use(
  cors({
    origin:
      "https://decor-frontend-pi.vercel.app/",
    credentials: true
  })
);
app.use(express.json());
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