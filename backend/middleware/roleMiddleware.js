const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // 🔹 Ensure user exists
    if (!req.user) {
      return res.status(401).json({
        code: "NO_USER",
        message: "Unauthorized. No user found in request",
      });
    }

    // 🔹 Ensure role exists
    if (!req.user.role) {
      return res.status(403).json({
        code: "NO_ROLE",
        message: "User role not defined",
      });
    }

    // 🔹 Normalize roles (avoid casing issues)
    const userRole = String(req.user.role).toLowerCase();
    const allowedRoles = roles.map((r) => String(r).toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      console.warn(
        `Role denied: user=${userRole}, required=${allowedRoles.join(",")}`
      );

      return res.status(403).json({
        code: "ACCESS_DENIED",
        message: "Access denied",
        userRole,
        allowedRoles,
      });
    }

    next();
  };
};

module.exports = authorizeRoles;