const express = require("express");
const router = express.Router();
const { validate, check } = require("../middleware/validator");

const { loginUser, registerUser } = require("../controllers/authController");

router.post(
  "/login",
  validate([
    check("password").notEmpty().withMessage("Password is required"),
  ]),
  loginUser
);

router.post(
  "/register",
  validate([
    check("username").trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),
    check("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters").matches(/[A-Z]/).withMessage("Must contain an uppercase letter").matches(/[0-9]/).withMessage("Must contain a number"),
    check("phone").trim().isLength({ min: 10 }).withMessage("Valid phone number required")
  ]),
  registerUser
);

module.exports = router;