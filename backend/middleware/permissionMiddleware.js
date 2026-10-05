const ROLE_PERMISSIONS = {
  admin: new Set(["*"]),
  milk_delivery_man: new Set([
    "milk:create_assigned",
    "milk:history_assigned",
    "customers:read_assigned",
  ]),
};

const MODULE_PERMISSION_MAP = {
  "milk:create_assigned": "milk_entry",
  "milk:history_assigned": "milk_entry",
  "customers:read_assigned": "customer_management",
};

const getGrantedModules = (user) => {
  if (!user || !Array.isArray(user.permissions)) return new Set();

  return new Set(
    user.permissions
      .filter((permission) => permission && permission.isActive !== false)
      .map((permission) => permission.module)
      .filter(Boolean)
  );
};

const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const permissions = ROLE_PERMISSIONS[req.user.role] || new Set();
  const grantedModules = getGrantedModules(req.user);
  const matchedModule = MODULE_PERMISSION_MAP[permission];

  const hasStaticPermission = permissions.has("*") || permissions.has(permission);
  const hasModulePermission = Boolean(matchedModule && grantedModules.has(matchedModule));

  if (!hasStaticPermission && !hasModulePermission) {
    return res.status(403).json({ message: "You do not have permission to perform this action" });
  }

  next();
};

module.exports = requirePermission;