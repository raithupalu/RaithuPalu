const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // 🔹 Extract token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length !== 2 || !parts[1]) {
      return res.status(401).json({
        code: "INVALID_TOKEN_FORMAT",
        message: "Invalid authorization header format",
      });
    }
    token = parts[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      code: "NO_TOKEN",
      message: "No token provided",
    });
  }

  // 🔹 Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.warn("JWT error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        code: "TOKEN_EXPIRED",
        message: "Session expired",
      });
    }

    return res.status(401).json({
      code: "TOKEN_INVALID",
      message: "Invalid token",
    });
  }

  const userId = decoded.id || decoded.userId;

  if (!userId) {
    return res.status(401).json({
      code: "INVALID_PAYLOAD",
      message: "Token payload invalid",
    });
  }

  // 🔹 DB check
  try {
    const user = await User.findById(userId)
      .select("_id role username")
      .lean();

    if (!user) {
      return res.status(401).json({
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    // 🔹 Attach minimal user object
    req.user = {
      id: user._id,
      role: user.role,
      username: user.username,
    };

    next();
  } catch (err) {
    console.error("Auth DB error:", err.message);
    res.status(500).json({
      code: "SERVER_ERROR",
      message: "Authentication failed",
    });
  }
};

module.exports = protect;