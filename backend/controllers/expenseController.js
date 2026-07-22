const Expense = require("../models/Expense");

// ADD EXPENSE with validation
exports.addExpense = async (req, res) => {
  try {
    const { title, amount } = req.body;

    // Validate input
    if (!title || !amount) {
      return res.status(400).json({ message: "Please provide title and amount" });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    if (title.length < 3) {
      return res.status(400).json({ message: "Title must be at least 3 characters" });
    }

    const expense = await Expense.create({
      title: title.trim(),
      amount,
      date: new Date(),
    });

    res.status(201).json({
      message: "Expense added ✅",
      expense,
    });
  } catch (err) {
    console.error("Add expense error:", err);
    res.status(500).json({ message: "Error adding expense" });
  }
};

// GET ALL EXPENSES with pagination
exports.getExpenses = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const expenses = await Expense.find()
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Expense.countDocuments();

    res.json({
      data: expenses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get expenses error:", err);
    res.status(500).json({ message: "Error fetching expenses" });
  }
};

// DELETE EXPENSE
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    console.error("Delete expense error:", err);
    res.status(500).json({ message: "Error deleting expense" });
  }
};

// UPDATE EXPENSE
exports.updateExpense = async (req, res) => {
  try {
    const { title, amount } = req.body;

    if (title !== undefined && title.length < 3) {
      return res.status(400).json({ message: "Title must be at least 3 characters" });
    }

    if (amount !== undefined && (typeof amount !== "number" || amount <= 0)) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { ...(title && { title: title.trim() }), ...(amount && { amount }) },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({
      message: "Expense updated successfully",
      expense,
    });
  } catch (err) {
    console.error("Update expense error:", err);
    res.status(500).json({ message: "Error updating expense" });
  }
};