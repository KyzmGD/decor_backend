const {
  Order,
  OrderStatusHistory,
  PaymentTransaction
} = require("../models");

const bankConfig = {
  bankName: process.env.BANK_NAME || "VietinBank",
  bankCode: process.env.BANK_CODE || "ICB",
  bankAccount:
    String(
      process.env.BANK_ACCOUNT_NUMBER || "100844608386"
    ).replace(/\s/g, ""),
  accountName:
    process.env.BANK_ACCOUNT_NAME || "NGUYEN NGOC TUAN LINH"
};

const buildQrCodeUrl = ({ amount, transferContent }) => {
  const path = [
    bankConfig.bankCode,
    bankConfig.bankAccount,
    "compact2.png"
  ].join("-");
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: transferContent,
    accountName: bankConfig.accountName
  });

  return `https://img.vietqr.io/image/${path}?${params.toString()}`;
};

const createPendingBankTransfer = async (
  order,
  userId,
  transaction
) => {
  const transferAmountVnd = Math.round(Number(order.totalPrice));
  const transferContent = `WOODORA${order.id}`;

  return PaymentTransaction.create(
    {
      orderId: order.id,
      userId,
      reference: transferContent,
      amount: order.totalPrice,
      currency: "VND",
      transferAmountVnd,
      exchangeRate: 1,
      bankName: bankConfig.bankName,
      bankAccount: bankConfig.bankAccount,
      accountName: bankConfig.accountName,
      transferContent,
      qrCodeUrl: buildQrCodeUrl({
        amount: transferAmountVnd,
        transferContent
      })
    },
    { transaction }
  );
};

const settlePayment = async ({
  payment,
  order,
  provider,
  providerTransactionId,
  paidAt,
  rawPayload,
  transaction
}) => {
  if (payment.status === "PAID") {
    return payment;
  }

  await payment.update(
    {
      status: "PAID",
      provider,
      providerTransactionId,
      paidAt,
      rawPayload
    },
    { transaction }
  );

  const orderUpdates = {
    paymentStatus: "PAID",
    paymentPaidAt: paidAt
  };

  if (order.status === "Pending" && order.stockConfirmed) {
    orderUpdates.status = "Confirmed";
    orderUpdates.confirmedAt = paidAt;
  }

  await order.update(orderUpdates, { transaction });

  if (orderUpdates.status === "Confirmed") {
    await OrderStatusHistory.create(
      {
        orderId: order.id,
        status: "Confirmed",
        changedAt: paidAt
      },
      { transaction }
    );
  }

  return payment;
};

const transactionInclude = {
  model: PaymentTransaction,
  as: "transactions",
  separate: true,
  order: [["createdAt", "DESC"]]
};

module.exports = {
  bankConfig,
  createPendingBankTransfer,
  settlePayment,
  transactionInclude
};
