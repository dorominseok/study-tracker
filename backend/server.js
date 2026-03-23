const express = require("express");
const cors = require("cors");
const db = require("./db");
const authRoutes = require("./routes/auth");
const subjectRoutes = require("./routes/subject");
const sessionRoutes = require("./routes/session");
const statisticsRoutes = require("./routes/statistics");
const dailyGoalRoutes = require("./routes/dailyGoal");

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: FRONTEND_ORIGIN
  })
);
app.use(express.json());
app.use(authRoutes);
app.use("/subjects", subjectRoutes);
app.use("/sessions", sessionRoutes);
app.use("/statistics", statisticsRoutes);
app.use("/daily-goal", dailyGoalRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Study Tracker API running" });
});

app.get("/users", (req, res) => {
  db.query("SELECT id, email, created_at FROM `User`", (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch users.",
        error: err.message
      });
    }

    return res.json(result);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
