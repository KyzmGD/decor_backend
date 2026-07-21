const { Op } = require("sequelize");

const {
  Product,
  Category
} = require("../models");

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

      res.json(products);

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