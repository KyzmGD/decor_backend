const {
  Category
} = require("../models");

exports.getCategories =
  async (req, res) => {

    const categories =
      await Category.findAll();

    res.json(categories);

};

exports.createCategory =
  async (req, res) => {

    const category =
      await Category.create(req.body);

    res.status(201).json(
      category
    );

};

exports.updateCategory =
  async (req, res) => {

    const category =
      await Category.findByPk(
        req.params.id
      );

    if (!category) {
      return res.status(404).json({
        message: "Not found"
      });
    }

    await category.update(
      req.body
    );

    res.json(category);

};

exports.deleteCategory =
  async (req, res) => {

    const category =
      await Category.findByPk(
        req.params.id
      );

    if (!category) {
      return res.status(404).json({
        message: "Not found"
      });
    }

    await category.destroy();

    res.json({
      message: "Deleted"
    });

};

exports.getCategoryById = async (
  req,
  res
) => {
  try {

    const category =
      await Category.findByPk(
        req.params.id
      );

    if (!category) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    res.json(category);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};