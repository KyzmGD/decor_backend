const { User } = require("../models");

const publicAttributes = [
  "id",
  "fullname",
  "email",
  "phone",
  "gender",
  "city",
  "district",
  "address",
  "avatar",
  "role",
  "lastLoginAt",
  "createdAt",
  "updatedAt"
];

exports.getAccounts = async (req, res) => {
  try {
    const accounts = await User.findAll({
      attributes: publicAttributes,
      order: [["createdAt", "DESC"]]
    });

    return res.json(accounts);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getAccount = async (req, res) => {
  try {
    const account = await User.findByPk(req.params.id, {
      attributes: publicAttributes
    });

    if (!account) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(account);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateAccountRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Role must be user or admin"
      });
    }

    const account = await User.findByPk(req.params.id);

    if (!account) {
      return res.status(404).json({ message: "User not found" });
    }

    if (account.id === req.user.id && role !== "admin") {
      return res.status(400).json({
        message: "You cannot remove your own admin permission"
      });
    }

    await account.update({ role });

    const safeAccount = account.toJSON();
    delete safeAccount.password;
    return res.json(safeAccount);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
