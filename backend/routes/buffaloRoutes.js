const express = require("express");
const router = express.Router();
const {
  addBuffalo,
  getBuffaloes,
  getBuffaloById,
  updateBuffalo,
  deleteBuffalo,
  addBuffaloMilk,
  getBuffaloMilks,
  addBuffaloChild,
  getBuffaloChildren,
  addBuffaloExpense,
  getBuffaloExpenses,
  addDeworming,
  getDewormingRecords,
  addMating,
  getMatingRecords,
} = require("../controllers/buffaloController");

// Mounted in server.js with protect + authorizeRoles("admin")
router.post("/", addBuffalo);
router.get("/", getBuffaloes);
router.get("/:id", getBuffaloById);
router.put("/:id", updateBuffalo);
router.delete("/:id", deleteBuffalo);

// Buffalo Milk
router.post("/milk", addBuffaloMilk);
router.get("/:buffaloId/milk", getBuffaloMilks);

// Buffalo Children
router.post("/child", addBuffaloChild);
router.get("/:buffaloId/children", getBuffaloChildren);

// Buffalo Expenses
router.post("/expense", addBuffaloExpense);
router.get("/:buffaloId/expenses", getBuffaloExpenses);

// Deworming
router.post("/deworming", addDeworming);
router.get("/:buffaloId/deworming", getDewormingRecords);

// Mating
router.post("/mating", addMating);
router.get("/:buffaloId/mating", getMatingRecords);

module.exports = router;
