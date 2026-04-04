const mysql = require("mysql2");
const dbConfig = require("./dbConfig");

// 서버 실행 시에는 DB 연결만 담당하고, 데이터 보정은 별도 마이그레이션 스크립트에서 처리한다.
const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) {
    console.error("DB connection failed:", err);
  } else {
    console.log("MariaDB connected");
  }
});

module.exports = db;
