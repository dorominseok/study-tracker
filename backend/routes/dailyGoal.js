const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const dbPromise = db.promise();

router.use(authMiddleware);

async function getTodayGoal(userId) {
  const [goals] = await dbPromise.query(
    "SELECT id, user_id, target_minutes, created_at FROM `DailyGoal` WHERE user_id = ? AND DATE(created_at) = CURDATE() ORDER BY created_at DESC, id DESC LIMIT 1",
    [userId]
  );

  return goals[0] || null;
}

router.get("/", async (req, res) => {
  try {
    const goal = await getTodayGoal(req.user.id);

    return res.status(200).json({
      goal
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch daily goal.",
      error: error.message
    });
  }
});

router.put("/", async (req, res) => {
  const targetMinutes = Number(req.body.targetMinutes);

  if (!Number.isInteger(targetMinutes) || targetMinutes <= 0) {
    return res.status(400).json({
      message: "targetMinutes must be a positive integer."
    });
  }

  try {
    const existingGoal = await getTodayGoal(req.user.id);

    if (existingGoal) {
      await dbPromise.query(
        "UPDATE `DailyGoal` SET target_minutes = ? WHERE id = ? AND user_id = ?",
        [targetMinutes, existingGoal.id, req.user.id]
      );

      const updatedGoal = await getTodayGoal(req.user.id);

      return res.status(200).json({
        message: "Daily goal updated successfully.",
        goal: updatedGoal
      });
    }

    const [insertResult] = await dbPromise.query(
      "INSERT INTO `DailyGoal` (user_id, target_minutes) VALUES (?, ?)",
      [req.user.id, targetMinutes]
    );
    const [goals] = await dbPromise.query(
      "SELECT id, user_id, target_minutes, created_at FROM `DailyGoal` WHERE id = ? AND user_id = ?",
      [insertResult.insertId, req.user.id]
    );

    return res.status(201).json({
      message: "Daily goal created successfully.",
      goal: goals[0]
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to save daily goal.",
      error: error.message
    });
  }
});

module.exports = router;
