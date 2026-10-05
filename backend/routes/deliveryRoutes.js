const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");
const deliveryController = require("../controllers/deliveryController");

const router = express.Router();

router.get(
  "/access/users",
  protect,
  authorizeRoles("admin"),
  deliveryController.listDeliveryUsers
);
router.get(
  "/access/users/:deliveryManId",
  protect,
  authorizeRoles("admin"),
  deliveryController.getDeliveryUserById
);
router.post(
  "/access/users",
  protect,
  authorizeRoles("admin"),
  deliveryController.createDeliveryUser
);
router.post(
  "/access/users/:deliveryManId/permissions",
  protect,
  authorizeRoles("admin"),
  deliveryController.grantDeliveryAccess
);
router.delete(
  "/access/users/:deliveryManId",
  protect,
  authorizeRoles("admin"),
  deliveryController.deleteDeliveryUser
);
router.get(
  "/access/users/:deliveryManId/assignments",
  protect,
  authorizeRoles("admin"),
  deliveryController.getAssignments
);
router.put(
  "/access/users/:deliveryManId/assignments",
  protect,
  authorizeRoles("admin"),
  deliveryController.replaceAssignments
);

router.get(
  "/milk",
  protect,
  authorizeRoles("milk_delivery_man"),
  requirePermission("milk:history_assigned"),
  deliveryController.getAllAssignedMilkHistory
);
router.get(
  "/customers",
  protect,
  authorizeRoles("milk_delivery_man"),
  requirePermission("customers:read_assigned"),
  deliveryController.listAssignedCustomers
);
router.get(
  "/customers/:customerId",
  protect,
  authorizeRoles("milk_delivery_man"),
  requirePermission("customers:read_assigned"),
  deliveryController.getAssignedCustomer
);
router.get(
  "/customers/:customerId/milk",
  protect,
  authorizeRoles("milk_delivery_man"),
  requirePermission("milk:history_assigned"),
  deliveryController.getAssignedMilkHistory
);
router.post(
  "/milk",
  protect,
  authorizeRoles("milk_delivery_man"),
  requirePermission("milk:create_assigned"),
  deliveryController.createAssignedMilkEntry
);

module.exports = router;