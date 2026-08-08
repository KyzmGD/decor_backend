const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ORDER_COLUMNS = {
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  shippingStartedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paymentStatus: {
    type: DataTypes.ENUM(
      "NOT_REQUIRED",
      "PENDING",
      "PAID",
      "FAILED",
      "CANCELLED",
      "REFUNDED"
    ),
    allowNull: false,
    defaultValue: "NOT_REQUIRED"
  },
  paymentPaidAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
};

const addMissingColumns = async (
  queryInterface,
  tableName,
  currentColumns,
  requiredColumns,
  changes
) => {
  for (const [name, definition] of Object.entries(requiredColumns)) {
    if (!currentColumns[name]) {
      await queryInterface.addColumn(tableName, name, definition);
      changes.push(`${tableName}.${name}`);
    }
  }
};

const ensureSchema = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const changes = [];
  const orderColumns = await queryInterface.describeTable("Orders");

  await addMissingColumns(
    queryInterface,
    "Orders",
    orderColumns,
    ORDER_COLUMNS,
    changes
  );

  if (
    orderColumns.paymentStatus &&
    !String(orderColumns.paymentStatus.type).includes("CANCELLED")
  ) {
    await queryInterface.changeColumn(
      "Orders",
      "paymentStatus",
      ORDER_COLUMNS.paymentStatus
    );
    changes.push("Orders.paymentStatus enum");
  }

  const userColumns = await queryInterface.describeTable("Users");

  await addMissingColumns(
    queryInterface,
    "Users",
    userColumns,
    {
      avatar: {
        type: DataTypes.TEXT("medium"),
        allowNull: true
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    changes
  );

  const productColumns = await queryInterface.describeTable("Products");

  await addMissingColumns(
    queryInterface,
    "Products",
    productColumns,
    {
      images: {
        type: DataTypes.JSON,
        allowNull: true
      }
    },
    changes
  );

  if (
    productColumns.image &&
    !String(productColumns.image.type).toUpperCase().includes("TEXT")
  ) {
    await queryInterface.changeColumn(
      "Products",
      "image",
      {
        type: DataTypes.TEXT("medium"),
        allowNull: true
      }
    );
    changes.push("Products.image type");
  }

  return { changes };
};

module.exports = ensureSchema;
