const sequelize = require("../config/db");
const { Product } = require("../models");

const IMAGE_COUNT = 6;

const getImageKeyword = (name) =>
  String(name || "furniture")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .at(-1) || "furniture";

const buildProductImage = (product, index) => {
  const keyword = getImageKeyword(product.name);
  const lock = Number(product.id) * IMAGE_COUNT + index + 1;

  return `https://loremflickr.com/800/800/${keyword}?lock=${lock}`;
};

const buildProductImages = (product) =>
  Array.from(
    { length: IMAGE_COUNT },
    (_, index) => buildProductImage(product, index)
  );

const getCurrentImages = (product) => [
  ...new Set(
    [
      product.image,
      ...(Array.isArray(product.images) ? product.images : [])
    ].filter(Boolean)
  )
];

const arraysEqual = (first, second) =>
  first.length === second.length &&
  first.every((value, index) => value === second[index]);

const backfillProductImages = async () => {
  const products = await Product.findAll({
    attributes: ["id", "name", "image", "images"],
    order: [["id", "ASC"]]
  });
  const claimedImages = new Set();
  const updates = [];

  for (const product of products) {
    const existingImages = getCurrentImages(product);
    const nextImages = [];

    for (const image of existingImages) {
      if (
        nextImages.length < IMAGE_COUNT &&
        !claimedImages.has(image)
      ) {
        nextImages.push(image);
        claimedImages.add(image);
      }
    }

    for (let index = 0; nextImages.length < IMAGE_COUNT; index += 1) {
      const image = buildProductImage(product, index);

      if (!claimedImages.has(image)) {
        nextImages.push(image);
        claimedImages.add(image);
      }
    }

    const storedImages = Array.isArray(product.images)
      ? product.images.filter(Boolean)
      : [];

    if (
      product.image !== nextImages[0] ||
      !arraysEqual(storedImages, nextImages)
    ) {
      updates.push({ product, images: nextImages });
    }
  }

  if (updates.length === 0) {
    return { updatedProducts: 0 };
  }

  const transaction = await sequelize.transaction();

  try {
    for (const { product, images } of updates) {
      await product.update(
        { image: images[0], images },
        { transaction }
      );
    }

    await transaction.commit();
    return { updatedProducts: updates.length };
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    throw error;
  }
};

module.exports = {
  IMAGE_COUNT,
  backfillProductImages,
  buildProductImages
};
