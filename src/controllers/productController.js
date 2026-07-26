const {
  Op,
  fn,
  col
} = require("sequelize");

const {
  Product,
  Category,
  Review
} = require("../models");

const attachReviewSummaries = async (products) => {
  if (!products.length) {
    return [];
  }

  const summaries = await Review.findAll({
    attributes: [
      "productId",
      [fn("AVG", col("rating")), "rating"],
      [fn("COUNT", col("id")), "reviewsCount"]
    ],
    where: {
      productId: {
        [Op.in]: products.map((product) => product.id)
      }
    },
    group: ["productId"],
    raw: true
  });

  const summaryByProduct = new Map(
    summaries.map((summary) => [
      Number(summary.productId),
      {
        rating: Number(summary.rating || 0),
        reviewsCount: Number(summary.reviewsCount || 0)
      }
    ])
  );

  return products.map((product) => ({
    ...product.toJSON(),
    ...(summaryByProduct.get(Number(product.id)) || {
      rating: 0,
      reviewsCount: 0
    })
  }));
};

exports.getProducts =
  async (req, res) => {

    try {

      const {
        category,
        keyword
      } = req.query;

      let where = {};

      if (category) {
        where.categoryId =
          category;
      }

      if (keyword) {
        where.name = {
          [Op.like]:
            `%${keyword}%`
        };
      }

      const products =
        await Product.findAll({
          where,
          include: [
            {
              model:
                Category
            }
          ],
          order: [
            [
              "createdAt",
              "DESC"
            ]
          ]
        });

      res.json(
        await attachReviewSummaries(products)
      );

    } catch (error) {

      res.status(500).json({
        message:
          error.message
      });

    }
};

exports.getProductById =
  async (req, res) => {

    try {

      const product =
        await Product.findByPk(
          req.params.id,
          {
            include: [
              {
                model:
                  Category
              }
            ]
          }
        );

      if (!product) {

        return res.status(404).json({
          message:
            "Product not found"
        });

      }

      res.json(product);

    } catch (error) {

      res.status(500).json({
        message:
          error.message
      });

    }
};

exports.createProduct =
  async (req, res) => {

    try {

      const product =
        await Product.create({
          name:
            req.body.name,

          description:
            req.body.description,

          price:
            req.body.price,

          stock:
            req.body.stock,

          image:
            req.body.image,

          categoryId:
            req.body.categoryId
        });

      res.status(201).json(
        product
      );

    } catch (error) {

      res.status(500).json({
        message:
          error.message
      });

    }
};

exports.updateProduct =
  async (req, res) => {

    try {

      const product =
        await Product.findByPk(
          req.params.id
        );

      if (!product) {

        return res.status(404).json({
          message:
            "Product not found"
        });

      }

      await product.update({
        name:
          req.body.name,

        description:
          req.body.description,

        price:
          req.body.price,

        stock:
          req.body.stock,

        image:
          req.body.image,

        categoryId:
          req.body.categoryId
      });

      res.json(product);

    } catch (error) {

      res.status(500).json({
        message:
          error.message
      });

    }
};

exports.deleteProduct =
  async (req, res) => {

    try {

      const product =
        await Product.findByPk(
          req.params.id
        );

      if (!product) {

        return res.status(404).json({
          message:
            "Product not found"
        });

      }

      await product.destroy();

      res.json({
        message:
          "Product deleted successfully"
      });

    } catch (error) {

      res.status(500).json({
        message:
          error.message
      });

    }
};
