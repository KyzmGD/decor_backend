const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { User } = require("../models");

exports.register = async (req, res) => {
  try {
    const {
      fullname,
      email,
      password
    } = req.body;

    const existingUser =
      await User.findOne({
        where: { email }
      });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user =
      await User.create({
        fullname,
        email,
        password: hashedPassword
      });

    res.status(201).json(user);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

exports.login = async (req, res) => {
  try {

    const {
      email,
      password
    } = req.body;

    const user =
      await User.findOne({
        where: { email }
      });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const match =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!match) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      token,
      user
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

exports.getProfile = async (
  req,
  res
) => {
  try {

    const user =
      await User.findByPk(
        req.user.id,
        {
          attributes: {
            exclude: ["password"]
          }
        }
      );

    res.json(user);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};