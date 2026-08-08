const { Review, User } = require("../models");

// GET /api/products/:id/reviews - Lấy danh sách đánh giá của sản phẩm
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { productId: req.params.id },
      include: [{ model: User, attributes: ["fullname", "email"] }],
      order: [["createdAt", "DESC"]]
    });

    // Map về đúng shape mà Frontend đang dùng
    const result = reviews.map((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.name,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/products/:id/reviews - Gửi đánh giá mới
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const userId = req.user.id;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: "Comment is required" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Lấy tên người dùng để hiển thị
    const user = await User.findByPk(userId);
    const name = user.fullname || user.email;

    const review = await Review.create({
      productId,
      userId,
      name,
      rating: Number(rating),
      comment: comment.trim()
    });

    res.status(201).json({
      id: review.id,
      userId: review.userId,
      name: review.name,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/reviews/:reviewId - User xóa đánh giá của mình, admin xóa mọi đánh giá
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const ownsReview = Number(review.userId) === Number(req.user.id);

    if (!ownsReview && req.user.role !== "admin") {
      return res.status(403).json({
        message: "You can only delete your own reviews"
      });
    }

    await review.destroy();
    return res.json({ message: "Review deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
