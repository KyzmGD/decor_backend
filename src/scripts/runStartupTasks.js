const backfillOrderStatusHistory =
  require("./backfillOrderStatusHistory");
const {
  backfillProductImages
} = require("./backfillProductImages");
const convertCurrencyToVnd = require("./convertCurrencyToVnd");
const ensureSchema = require("./ensureSchema");

const logResult = (taskName, result) => {
  const details = Object.entries(result || {})
    .filter(([, value]) => value !== 0 && value !== false)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(" ");

  console.log(
    `[startup] ${taskName}${details ? ` ${details}` : ""}`
  );
};

const runStartupTasks = async () => {
  const tasks = [
    ["ensure-schema", ensureSchema],
    ["convert-currency-to-vnd", convertCurrencyToVnd],
    ["backfill-order-status-history", backfillOrderStatusHistory],
    ["backfill-product-images", backfillProductImages]
  ];

  for (const [name, task] of tasks) {
    const result = await task();
    logResult(name, result);
  }
};

module.exports = runStartupTasks;
