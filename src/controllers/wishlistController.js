const { Wishlist, Product, Category } = require("../models");

// GET /api/wishlist - Lấy danh sách yêu thích
exports.getWishlist = async (req, res) => {
  try {
    const items = await Wishlist.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Product,
          include: [{ model: Category }]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    const products = items
      .filter((item) => item.Product)
      .map((item) => item.Product);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/wishlist - Thêm sản phẩm vào yêu thích
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    const [item, created] = await Wishlist.findOrCreate({
      where: { userId: req.user.id, productId },
      defaults: { userId: req.user.id, productId }
    });

    res.status(created ? 201 : 200).json({
      message: created ? "Added to wishlist" : "Already in wishlist",
      productId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/wishlist/:productId - Xóa sản phẩm khỏi yêu thích
exports.removeFromWishlist = async (req, res) => {
  try {
    await Wishlist.destroy({
      where: {
        userId: req.user.id,
        productId: req.params.productId
      }
    });

    res.json({ message: "Removed from wishlist" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/wishlist - Xóa toàn bộ yêu thích
exports.clearWishlist = async (req, res) => {
  try {
    await Wishlist.destroy({
      where: { userId: req.user.id }
    });

    res.json({ message: "Wishlist cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
