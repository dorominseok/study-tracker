const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const dbPromise = db.promise();

router.use(authMiddleware);

function formatDay(day) {
  if (day instanceof Date) {
    return day.toISOString().slice(0, 10);
  }

  return String(day).slice(0, 10);
}

router.get("/daily", async (req, res) => {
  try {
    const [rows] = await dbPromise.query(
      "SELECT COALESCE(SUM(duration), 0) AS totalSeconds FROM `StudySession` WHERE user_id = ? AND DATE(start_time) = CURDATE()",
      [req.user.id]
    );

    return res.status(200).json({
      totalSeconds: Number(rows[0]?.totalSeconds || 0)
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch daily statistics.",
      error: error.message
    });
  }
});

router.get("/weekly", async (req, res) => {
  try {
    const [rows] = await dbPromise.query(
      "SELECT DATE(start_time) AS day, SUM(duration) AS totalSeconds FROM `StudySession` WHERE user_id = ? AND start_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY DATE(start_time) ORDER BY day ASC",
      [req.user.id]
    );

    return res.status(200).json(
      rows.map((row) => ({
        day: formatDay(row.day),
        totalSeconds: Number(row.totalSeconds || 0)
      }))
    );
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch weekly statistics.",
      error: error.message
    });
  }
});

module.exports = router;
