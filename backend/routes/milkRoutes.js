const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { validate, check } = require("../middleware/validator");

const {
  addMilkEntry,
  getMyMilkEntries,
  getAllMilkEntries,
  getLastMilkEntryForUser,
  deleteMilkEntry,
  getMilkByUserAndMonth,
} = require("../controllers/milkController");

// ✅ Sync with model + controller
const ALLOWED_QUANTITIES = [0.25, 0.5, 0.75, 1, 2, 5];
const ALLOWED_PRICES = [60, 70, 80];

// ==========================
// ROUTES
// ==========================

// 🔹 Customer
router.get("/my", protect, authorizeRoles("customer"), getMyMilkEntries);

// 🔹 Admin
router.get("/", protect, authorizeRoles("admin"), getAllMilkEntries);

// 🔹 IMPORTANT: define specific routes BEFORE dynamic ones
router.get("/last/:id", protect, getLastMilkEntryForUser);

// 🔹 Monthly data (admin OR same user)
router.get("/:userId/month", protect, getMilkByUserAndMonth);

// 🔹 Create milk entry
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  validate([
    check("userId")
      .isMongoId()
      .withMessage("Invalid customer ID"),

    check("quantity")
      .isFloat()
      .withMessage("Quantity must be a number")
      .custom((value) => {
        if (!ALLOWED_QUANTITIES.includes(Number(value))) {
          throw new Error(
            `Quantity must be one of: ${ALLOWED_QUANTITIES.join(", ")} L`
          );
        }
        return true;
      }),

    check("pricePerLitre")
      .isFloat()
      .withMessage("Price must be a number")
      .custom((value) => {
        if (!ALLOWED_PRICES.includes(Number(value))) {
          throw new Error(
            `Price must be one of: ${ALLOWED_PRICES.join(", ")}`
          );
        }
        return true;
      }),

    check("session")
      .isIn(["morning", "evening"])
      .withMessage("Invalid session"),

    check("date")
      .isISO8601()
      .toDate()
      .withMessage("Valid date required"),
  ]),
  addMilkEntry
);

// 🔹 Delete entry
router.delete("/:id", protect, authorizeRoles("admin"), deleteMilkEntry);

module.exports = router;