const { UniqueConstraintError } = require("sequelize");
const sequelize = require("../config/db");
const {
  Order,
  OrderItem,
  PaymentTransaction,
  Product,
  SystemSetting
} = require("../models");

const MIGRATION_KEY = "currency_vnd_conversion_v1";
const LEGACY_USD_TO_VND_RATE = 26000;

const multiplyByLegacyRate = (column) =>
  sequelize.literal(
    `ROUND(${column} * ${LEGACY_USD_TO_VND_RATE}, 0)`
  );

const convertCurrencyToVnd = async () => {
  if (await SystemSetting.findByPk(MIGRATION_KEY)) {
    return { skipped: true };
  }

  const transaction = await sequelize.transaction();

  try {
    const marker = await SystemSetting.create(
      {
        key: MIGRATION_KEY,
        value: "in-progress"
      },
      { transaction }
    );

    const [products] = await Product.update(
      { price: multiplyByLegacyRate("price") },
      { where: {}, transaction }
    );
    const [orderItems] = await OrderItem.update(
      { price: multiplyByLegacyRate("price") },
      { where: {}, transaction }
    );
    const [orders] = await Order.update(
      {
        totalPrice: multiplyByLegacyRate("totalPrice"),
        shippingFee: multiplyByLegacyRate("shippingFee"),
        discount: multiplyByLegacyRate("discount")
      },
      { where: {}, transaction }
    );
    const [paymentTransactions] = await PaymentTransaction.update(
      {
        amount: sequelize.literal("transferAmountVnd"),
        currency: "VND",
        exchangeRate: 1
      },
      { where: {}, transaction }
    );

    await marker.update(
      {
        value: JSON.stringify({
          rate: LEGACY_USD_TO_VND_RATE,
          completedAt: new Date().toISOString()
        })
      },
      { transaction }
    );

    await transaction.commit();

    return {
      skipped: false,
      products,
      orderItems,
      orders,
      paymentTransactions
    };
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();

    if (error instanceof UniqueConstraintError) {
      return { skipped: true };
    }

    throw error;
  }
};

module.exports = convertCurrencyToVnd;
