const { Product } = require("../models");

const IMAGE_COUNT = 6;

const buildProductImages = (product) => {
  const keyword = String(product.name || "furniture")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .at(-1) || "furniture";

  return Array.from({ length: IMAGE_COUNT }, (_, index) => {
    const lock = Number(product.id) * IMAGE_COUNT + index + 1;
    return `https://loremflickr.com/800/800/${keyword}?lock=${lock}`;
  });
};

const backfillProductImages = async () => {
  const products = await Product.findAll();
  const imageUsage = new Map();

  products.forEach((product) => {
    (Array.isArray(product.images) ? product.images : []).forEach((image) => {
      imageUsage.set(image, (imageUsage.get(image) || 0) + 1);
    });
  });

  for (const product of products) {
    const currentImages = Array.isArray(product.images)
      ? product.images.filter(Boolean)
      : [];
    const valid = currentImages.length === IMAGE_COUNT &&
      new Set(currentImages).size === IMAGE_COUNT &&
      currentImages.every((image) => imageUsage.get(image) === 1);

    if (!valid) {
      const images = buildProductImages(product);
      await product.update({ image: images[0], images });
    }
  }
};

module.exports = { backfillProductImages, buildProductImages };
