const express = require("express");
const router = express.Router();

const {
  getUsers,
  getUserById,
  deleteUser,
} = require("../controllers/userController");

const auth = require("../middleware/authMiddleware");

// Admin routes
router.get("/", auth, getUsers);
router.get("/:id", auth, getUserById);
router.delete("/:id", auth, deleteUser);

module.exports = router;