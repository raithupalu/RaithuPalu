const express = require("express");
const router = express.Router();

const {
  getMySubscription,
  updateMySubscription,
  toggleVacationMode,
  getAllSubscriptions,
} = require("../controllers/subscriptionController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// 🔹 Customer Portal endpoints
router.get("/my", protect, getMySubscription);
router.put("/my", protect, updateMySubscription);
router.post("/my/vacation", protect, toggleVacationMode);

// 👑 Admin Portal endpoints
router.get("/", protect, authorizeRoles("admin"), getAllSubscriptions);

module.exports = router;