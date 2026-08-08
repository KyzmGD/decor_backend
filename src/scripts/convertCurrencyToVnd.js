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

async function convertCurrencyToVnd() {
  const transaction = await sequelize.transaction();

  try {
    const completed = await SystemSetting.findByPk(
      MIGRATION_KEY,
      {
        transaction,
        lock: transaction.LOCK.UPDATE
      }
    );

    if (completed) {
      await transaction.commit();
      return;
    }

    const multiply = (column) =>
      sequelize.literal(
        `ROUND(${column} * ${LEGACY_USD_TO_VND_RATE}, 0)`
      );

    await Product.update(
      { price: multiply("price") },
      { where: {}, transaction }
    );
    await OrderItem.update(
      { price: multiply("price") },
      { where: {}, transaction }
    );
    await Order.update(
      {
        totalPrice: multiply("totalPrice"),
        shippingFee: multiply("shippingFee"),
        discount: multiply("discount")
      },
      { where: {}, transaction }
    );
    await PaymentTransaction.update(
      {
        amount: sequelize.literal("transferAmountVnd"),
        currency: "VND",
        exchangeRate: 1
      },
      { where: {}, transaction }
    );

    await SystemSetting.create(
      {
        key: MIGRATION_KEY,
        value: JSON.stringify({
          rate: LEGACY_USD_TO_VND_RATE,
          completedAt: new Date().toISOString()
        })
      },
      { transaction }
    );

    await transaction.commit();
    console.log(
      `Converted existing monetary values to VND at ${LEGACY_USD_TO_VND_RATE} VND/USD`
    );
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    throw error;
  }
}

module.exports = convertCurrencyToVnd;
