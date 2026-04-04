const mysql = require("mysql2/promise");
const dbConfig = require("../dbConfig");

// 기존 StudySession 테이블 구조와 데이터를 현재 세션 상태 규칙에 맞게 한 번 보정한다.
async function ensureStudySessionSchema(connection) {
  const [columns] = await connection.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'StudySession'"
  );
  const columnNames = new Set(columns.map((column) => column.COLUMN_NAME));

  if (!columnNames.has("status")) {
    await connection.query(
      "ALTER TABLE `StudySession` ADD COLUMN `status` ENUM('active', 'paused', 'completed') NOT NULL DEFAULT 'active' AFTER `memo`"
    );
    console.log("Added StudySession.status column");
  }

  if (!columnNames.has("last_resume_time")) {
    await connection.query(
      "ALTER TABLE `StudySession` ADD COLUMN `last_resume_time` DATETIME NULL AFTER `status`"
    );
    console.log("Added StudySession.last_resume_time column");
  }

  await connection.query(
    "UPDATE `StudySession` SET status = CASE WHEN end_time IS NOT NULL THEN 'completed' WHEN end_time IS NULL AND COALESCE(duration, 0) > 0 AND last_resume_time IS NULL THEN 'paused' ELSE 'active' END"
  );
  await connection.query(
    "UPDATE `StudySession` SET duration = COALESCE(duration, 0)"
  );
  await connection.query(
    "UPDATE `StudySession` SET last_resume_time = CASE WHEN status = 'active' AND end_time IS NULL THEN COALESCE(last_resume_time, start_time) ELSE NULL END"
  );

  console.log("StudySession schema migration completed");
}

async function run() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    await ensureStudySessionSchema(connection);
  } catch (error) {
    console.error("Failed to migrate StudySession schema:", error);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();
