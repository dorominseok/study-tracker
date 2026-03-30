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

router.get("/heatmap", async (req, res) => {
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  const now = new Date();
  const targetYear = Number.isInteger(year) ? year : now.getFullYear();
  const targetMonth = Number.isInteger(month) ? month : now.getMonth() + 1;

  if (targetMonth < 1 || targetMonth > 12) {
    return res.status(400).json({
      message: "month must be between 1 and 12."
    });
  }

  try {
    const [rows] = await dbPromise.query(
      `
        SELECT DATE(start_time) AS day, SUM(duration) AS totalSeconds
        FROM \`StudySession\`
        WHERE user_id = ? AND YEAR(start_time) = ? AND MONTH(start_time) = ?
        GROUP BY DATE(start_time)
        ORDER BY day ASC
      `,
      [req.user.id, targetYear, targetMonth]
    );

    return res.status(200).json({
      year: targetYear,
      month: targetMonth,
      days: rows.map((row) => ({
        day: formatDay(row.day),
        totalSeconds: Number(row.totalSeconds || 0)
      }))
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch heatmap statistics.",
      error: error.message
    });
  }
});

module.exports = router;
