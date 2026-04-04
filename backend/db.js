const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "study_tracker"
});

async function ensureStudySessionSchema() {
  const dbPromise = db.promise();
  const [columns] = await dbPromise.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'StudySession'"
  );
  const columnNames = new Set(columns.map((column) => column.COLUMN_NAME));

  if (!columnNames.has("status")) {
    await dbPromise.query(
      "ALTER TABLE `StudySession` ADD COLUMN `status` ENUM('active', 'paused', 'completed') NOT NULL DEFAULT 'active' AFTER `memo`"
    );
  }

  if (!columnNames.has("last_resume_time")) {
    await dbPromise.query(
      "ALTER TABLE `StudySession` ADD COLUMN `last_resume_time` DATETIME NULL AFTER `status`"
    );
  }

  // 예전 데이터도 현재 세션 상태 규칙과 맞도록 한 번 정규화한다.
  await dbPromise.query(
    "UPDATE `StudySession` SET status = CASE WHEN end_time IS NOT NULL THEN 'completed' WHEN end_time IS NULL AND COALESCE(duration, 0) > 0 AND last_resume_time IS NULL THEN 'paused' ELSE 'active' END"
  );
  await dbPromise.query(
    "UPDATE `StudySession` SET duration = COALESCE(duration, 0)"
  );
  await dbPromise.query(
    "UPDATE `StudySession` SET last_resume_time = CASE WHEN status = 'active' AND end_time IS NULL THEN COALESCE(last_resume_time, start_time) ELSE NULL END"
  );
}

db.connect((err) => {
  if (err) {
    console.error("DB connection failed:", err);
  } else {
    ensureStudySessionSchema()
      .then(() => {
        console.log("MariaDB connected");
      })
      .catch((schemaError) => {
        console.error("Failed to ensure StudySession schema:", schemaError);
      });
  }
});

module.exports = db;
