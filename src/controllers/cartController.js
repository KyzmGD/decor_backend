const { CartItem, Product, Category } = require("../models");

// GET /api/cart - Lấy giỏ hàng
exports.getCart = async (req, res) => {
  try {
    const items = await CartItem.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Product,
          include: [{ model: Category }]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    const result = items
      .filter((item) => item.Product)
      .map((item) => ({
        ...item.Product.toJSON(),
        quantity: item.quantity
      }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/cart - Thêm sản phẩm vào giỏ
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const existing = await CartItem.findOne({
      where: { userId: req.user.id, productId }
    });

    if (existing) {
      existing.quantity += quantity;
      await existing.save();
      res.json({ message: "Cart updated", productId, quantity: existing.quantity });
    } else {
      await CartItem.create({
        userId: req.user.id,
        productId,
        quantity
      });
      res.status(201).json({ message: "Added to cart", productId, quantity });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/cart/:productId - Cập nhật số lượng
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;

    const item = await CartItem.findOne({
      where: {
        userId: req.user.id,
        productId: req.params.productId
      }
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    item.quantity = quantity;
    await item.save();

    res.json({ message: "Quantity updated", productId: req.params.productId, quantity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/cart/:productId - Xóa sản phẩm khỏi giỏ
exports.removeFromCart = async (req, res) => {
  try {
    await CartItem.destroy({
      where: {
        userId: req.user.id,
        productId: req.params.productId
      }
    });

    res.json({ message: "Removed from cart" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/cart - Xóa toàn bộ giỏ hàng
exports.clearCart = async (req, res) => {
  try {
    await CartItem.destroy({
      where: { userId: req.user.id }
    });

    res.json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
