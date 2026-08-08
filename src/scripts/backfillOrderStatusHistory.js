const { Op } = require("sequelize");
const sequelize = require("../config/db");
const {
  Order,
  OrderStatusHistory
} = require("../models");

const addEvent = (events, status, changedAt) => {
  if (
    !changedAt ||
    events.some((event) => event.status === status)
  ) {
    return;
  }

  events.push({ status, changedAt });
};

const buildHistoryRows = (order) => {
  const events = [];

  if (order.requiresStockConfirmation) {
    addEvent(events, "Pending", order.createdAt);
  }

  addEvent(events, "Confirmed", order.confirmedAt);
  addEvent(events, "Shipping", order.shippingStartedAt);
  addEvent(events, "Delivered", order.deliveredAt);
  addEvent(
    events,
    order.status,
    order.updatedAt || order.createdAt
  );

  return events
    .sort(
      (first, second) =>
        new Date(first.changedAt) - new Date(second.changedAt)
    )
    .map((event) => ({ orderId: order.id, ...event }));
};

const backfillOrderStatusHistory = async () => {
  const existingRows = await OrderStatusHistory.findAll({
    attributes: ["orderId"],
    group: ["orderId"],
    raw: true
  });
  const existingOrderIds = existingRows.map((row) => row.orderId);
  const where = existingOrderIds.length > 0
    ? { id: { [Op.notIn]: existingOrderIds } }
    : {};
  const orders = await Order.findAll({
    attributes: [
      "id",
      "status",
      "requiresStockConfirmation",
      "confirmedAt",
      "shippingStartedAt",
      "deliveredAt",
      "createdAt",
      "updatedAt"
    ],
    where
  });
  const rows = orders.flatMap(buildHistoryRows);

  if (rows.length === 0) {
    return { createdEvents: 0 };
  }

  await sequelize.transaction(async (transaction) => {
    await OrderStatusHistory.bulkCreate(rows, { transaction });
  });

  return { createdEvents: rows.length };
};

module.exports = backfillOrderStatusHistory;
