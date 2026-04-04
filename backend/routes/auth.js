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
  // 회원가입과 로그인에서 공통으로 사용할 JWT를 생성한다.
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
      message: "이메일과 비밀번호를 입력해주세요."
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      message: "이메일 형식이 올바르지 않습니다."
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "비밀번호는 6자 이상이어야 합니다."
    });
  }

  try {
    const [existingUsers] = await dbPromise.query(
      "SELECT id FROM `User` WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "이미 가입된 이메일입니다."
      });
    }

    // 비밀번호 원문을 저장하지 않고 해시 값만 DB에 저장한다.
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
      message: "회원가입이 완료되었습니다.",
      token,
      user
    });
  } catch (error) {
    return res.status(500).json({
      message: "회원가입에 실패했습니다.",
      error: error.message
    });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "이메일과 비밀번호를 입력해주세요."
    });
  }

  try {
    const [users] = await dbPromise.query(
      "SELECT id, email, password_hash FROM `User` WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "이메일 또는 비밀번호가 올바르지 않습니다."
      });
    }

    const user = users[0];
    const isPasswordMatched = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordMatched) {
      return res.status(401).json({
        message: "이메일 또는 비밀번호가 올바르지 않습니다."
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      message: "로그인되었습니다.",
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "로그인에 실패했습니다.",
      error: error.message
    });
  }
});

module.exports = router;
