const {
  Order,
  OrderStatusHistory
} = require("../models");

const addEvent = (events, status, changedAt) => {
  if (!changedAt || events.some((event) => event.status === status)) return;
  events.push({ status, changedAt });
};

const backfillOrderStatusHistory = async () => {
  const orders = await Order.findAll({
    include: [{
      model: OrderStatusHistory,
      as: "statusHistory",
      attributes: ["id"]
    }]
  });
  const rows = [];

  orders.forEach((order) => {
    if (order.statusHistory.length > 0) return;

    const events = [];
    if (order.requiresStockConfirmation) {
      addEvent(events, "Pending", order.createdAt);
    }
    addEvent(events, "Confirmed", order.confirmedAt);
    addEvent(events, "Shipping", order.shippingStartedAt);
    addEvent(events, "Delivered", order.deliveredAt);
    addEvent(events, order.status, order.updatedAt || order.createdAt);

    events
      .sort((first, second) =>
        new Date(first.changedAt) - new Date(second.changedAt)
      )
      .forEach((event) => rows.push({ orderId: order.id, ...event }));
  });

  if (rows.length > 0) {
    await OrderStatusHistory.bulkCreate(rows);
    console.log(`Backfilled ${rows.length} order status history events`);
  }
};

module.exports = backfillOrderStatusHistory;
