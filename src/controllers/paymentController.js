const crypto = require("crypto");
const sequelize = require("../config/db");
const {
  Order,
  PaymentTransaction
} = require("../models");
const {
  bankConfig,
  settlePayment
} = require("../services/paymentService");

const safeEqual = (actual, expected) => {
  const first = Buffer.from(String(actual || ""));
  const second = Buffer.from(String(expected || ""));

  return (
    first.length === second.length &&
    crypto.timingSafeEqual(first, second)
  );
};

const extractReference = (payload) => {
  const text = [
    payload.code,
    payload.content,
    payload.description
  ].filter(Boolean).join(" ").toUpperCase();
  const match = text.match(/WOODORA[\s._-]*(\d+)/);

  return match ? `WOODORA${match[1]}` : null;
};

exports.getMyTransactions = async (req, res) => {
  try {
    const transactions = await PaymentTransaction.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Order,
        attributes: ["id", "status", "paymentMethod", "paymentStatus"]
      }],
      order: [["createdAt", "DESC"]]
    });

    res.set("Cache-Control", "no-store");
    return res.json(transactions);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.confirmPaymentManually = async (req, res) => {
  const dbTransaction = await sequelize.transaction();

  try {
    const payment = await PaymentTransaction.findByPk(
      req.params.id,
      {
        transaction: dbTransaction,
        lock: dbTransaction.LOCK.UPDATE
      }
    );

    if (!payment) {
      await dbTransaction.rollback();
      return res.status(404).json({ message: "Payment transaction not found" });
    }

    if (["CANCELLED", "REFUNDED"].includes(payment.status)) {
      await dbTransaction.rollback();
      return res.status(409).json({ message: "This transaction cannot be confirmed" });
    }

    const order = await Order.findByPk(payment.orderId, {
      transaction: dbTransaction,
      lock: dbTransaction.LOCK.UPDATE
    });
    const paidAt = new Date();

    await settlePayment({
      payment,
      order,
      provider: "MANUAL",
      providerTransactionId:
        payment.providerTransactionId || `MANUAL-${payment.id}-${Date.now()}`,
      paidAt,
      rawPayload: {
        confirmedBy: req.user.id,
        note: req.body.note || null
      },
      transaction: dbTransaction
    });

    await dbTransaction.commit();
    return res.json(await PaymentTransaction.findByPk(payment.id));
  } catch (error) {
    if (!dbTransaction.finished) await dbTransaction.rollback();
    return res.status(500).json({ message: error.message });
  }
};

exports.handleSePayWebhook = async (req, res) => {
  const expectedApiKey = process.env.SEPAY_WEBHOOK_API_KEY;
  const authorization = req.headers.authorization;

  if (
    !expectedApiKey ||
    !safeEqual(authorization, `Apikey ${expectedApiKey}`)
  ) {
    return res.status(401).json({ success: false, message: "Invalid webhook authentication" });
  }

  const payload = req.body || {};
  const providerTransactionId = String(payload.id || "");
  const reference = extractReference(payload);
  const receivedAccount = String(payload.accountNumber || "").replace(/\s/g, "");

  if (
    payload.transferType !== "in" ||
    !providerTransactionId ||
    !reference ||
    receivedAccount !== bankConfig.bankAccount
  ) {
    return res.status(400).json({ success: false, message: "Invalid transaction payload" });
  }

  const existing = await PaymentTransaction.findOne({
    where: { providerTransactionId }
  });

  if (existing) {
    return res.json({ success: true, message: "Transaction already processed" });
  }

  const dbTransaction = await sequelize.transaction();

  try {
    const payment = await PaymentTransaction.findOne({
      where: { reference },
      transaction: dbTransaction,
      lock: dbTransaction.LOCK.UPDATE
    });

    if (!payment) {
      await dbTransaction.rollback();
      return res.status(404).json({ success: false, message: "Payment reference not found" });
    }

    if (Number(payload.transferAmount) < Number(payment.transferAmountVnd)) {
      await payment.update(
        { rawPayload: payload },
        { transaction: dbTransaction }
      );
      await dbTransaction.commit();
      return res.json({ success: true, message: "Payment amount is insufficient" });
    }

    const order = await Order.findByPk(payment.orderId, {
      transaction: dbTransaction,
      lock: dbTransaction.LOCK.UPDATE
    });
    const paidAt = payload.transactionDate
      ? new Date(payload.transactionDate.replace(" ", "T") + "+07:00")
      : new Date();

    await settlePayment({
      payment,
      order,
      provider: "SEPAY",
      providerTransactionId,
      paidAt: Number.isNaN(paidAt.getTime()) ? new Date() : paidAt,
      rawPayload: payload,
      transaction: dbTransaction
    });

    await dbTransaction.commit();
    return res.json({ success: true });
  } catch (error) {
    if (!dbTransaction.finished) await dbTransaction.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};
