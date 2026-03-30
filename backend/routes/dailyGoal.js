const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const dbPromise = db.promise();

router.use(authMiddleware);

function formatDay(day) {
  if (day instanceof Date) {
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, "0");
    const date = String(day.getDate()).padStart(2, "0");

    return `${year}-${month}-${date}`;
  }

  return String(day).slice(0, 10);
}

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

router.get("/history", async (req, res) => {
  try {
    const [rows] = await dbPromise.query(
      `
        SELECT
          latest_goals.goal_day AS day,
          goals.target_minutes,
          COALESCE(study.totalSeconds, 0) AS totalSeconds
        FROM (
          SELECT DATE(created_at) AS goal_day, MAX(id) AS latest_goal_id
          FROM \`DailyGoal\`
          WHERE user_id = ?
          GROUP BY DATE(created_at)
        ) AS latest_goals
        JOIN \`DailyGoal\` AS goals
          ON goals.id = latest_goals.latest_goal_id
        LEFT JOIN (
          SELECT DATE(start_time) AS study_day, SUM(duration) AS totalSeconds
          FROM \`StudySession\`
          WHERE user_id = ?
          GROUP BY DATE(start_time)
        ) AS study
          ON study.study_day = latest_goals.goal_day
        ORDER BY latest_goals.goal_day DESC
        LIMIT 7
      `,
      [req.user.id, req.user.id]
    );

    return res.status(200).json({
      goals: rows.map((row) => ({
        day: formatDay(row.day),
        targetMinutes: Number(row.target_minutes || 0),
        totalSeconds: Number(row.totalSeconds || 0),
        completed: Number(row.totalSeconds || 0) >= Number(row.target_minutes || 0) * 60
      }))
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch goal history.",
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
        message: "일일 목표가 설정되었습니다.",
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
      message: "일일 목표가 설정되었습니다.",
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
