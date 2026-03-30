const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();
const dbPromise = db.promise();

const JWT_SECRET = process.env.JWT_SECRET || "study_tracker_dev_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const SALT_ROUNDS = 10;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "email and password are required."
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      message: "Invalid email format."
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters long."
    });
  }

  try {
    const [existingUsers] = await dbPromise.query(
      "SELECT id FROM `User` WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Email is already registered."
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [insertResult] = await dbPromise.query(
      "INSERT INTO `User` (email, password_hash) VALUES (?, ?)",
      [email, passwordHash]
    );

    const user = {
      id: insertResult.insertId,
      email
    };

    const token = createToken(user);

    return res.status(201).json({
      message: "User registered successfully.",
      token,
      user
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to register user.",
      error: error.message
    });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "email and password are required."
    });
  }

  try {
    const [users] = await dbPromise.query(
      "SELECT id, email, password_hash FROM `User` WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "아이디 또는 비밀번호가 잘못되었습니다."
      });
    }

    const user = users[0];
    const isPasswordMatched = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordMatched) {
      return res.status(401).json({
        message: "아이디 또는 비밀번호가 잘못되었습니다."
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to login.",
      error: error.message
    });
  }
});

module.exports = router;
