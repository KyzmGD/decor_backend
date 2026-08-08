require("dotenv").config();

const checkDatabase = async () => {
  let sequelize;

  try {
    sequelize = require("../src/config/db");
    await sequelize.authenticate();
    console.log("Database connection successful");
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await sequelize?.close();
  }
};

checkDatabase();
