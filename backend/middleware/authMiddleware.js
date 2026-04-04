const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "study_tracker_dev_secret";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Authorization header is required."
    });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Authorization header must use the Bearer scheme."
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // 이후 라우트에서 필요한 사용자 식별 정보만 req.user에 담아 사용한다.
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token."
    });
  }
}

module.exports = authMiddleware;
