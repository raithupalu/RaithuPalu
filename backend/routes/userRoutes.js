const express = require("express");
const router = express.Router();

const {
  getUsers,
  getUserById,
  deleteUser,
} = require("../controllers/userController");

const auth = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Admin routes
router.get("/", auth, authorizeRoles("admin"), getUsers);
router.get("/:id", auth, getUserById);
router.delete("/:id", auth, authorizeRoles("admin"), deleteUser);

module.exports = router;