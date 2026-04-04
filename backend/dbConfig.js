// 환경변수가 없으면 로컬 개발 환경에서 사용할 기본 DB 설정을 사용한다.
module.exports = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "1234",
  database: process.env.DB_NAME || "study_tracker"
};
