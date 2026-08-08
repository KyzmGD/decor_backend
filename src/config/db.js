const { Sequelize } = require("sequelize");

const requiredVariables = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const missingVariables = requiredVariables.filter(
  (variable) => !process.env[variable]?.trim()
);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing database environment variables: ${missingVariables.join(", ")}. ` +
      "Create backend/.env from backend/.env.example and enter your MySQL credentials."
  );
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    dialect: "mysql",
    logging: false
  }
);

module.exports = sequelize;
