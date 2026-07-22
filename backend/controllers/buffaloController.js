const Buffalo = require("../models/Buffalo");
const Child = require("../models/Child");
const BuffaloMilk = require("../models/BuffaloMilk");
const BuffaloExpense = require("../models/BuffaloExpense");
const Deworming = require("../models/Deworming");
const Mating = require("../models/Mating");

exports.addBuffalo = async (req, res) => {
  try {
    const { name, tagId, breed, age, status, purchaseDate, notes, milkCapacity } = req.body;

    if (!name || String(name).trim().length < 1) {
      return res.status(400).json({ message: "Name is required" });
    }

    const payload = {
      name: String(name).trim(),
      tagId: tagId ? String(tagId).trim() : "",
      breed: breed ? String(breed).trim() : "",
      age: age != null ? Number(age) : undefined,
      status: status || "active",
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      notes: notes ? String(notes).trim() : "",
      milkCapacity: milkCapacity != null ? Number(milkCapacity) : undefined,
    };

    if (payload.age != null && (Number.isNaN(payload.age) || payload.age < 0)) {
      return res.status(400).json({ message: "Age must be a non-negative number" });
    }
    if (payload.milkCapacity != null && (Number.isNaN(payload.milkCapacity) || payload.milkCapacity < 0)) {
      return res.status(400).json({ message: "Milk capacity must be a non-negative number" });
    }

    const buffalo = await Buffalo.create(payload);
    res.status(201).json(buffalo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBuffaloes = async (req, res) => {
  try {
    const data = await Buffalo.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBuffaloById = async (req, res) => {
  try {
    const { id } = req.params;
    const buffalo = await Buffalo.findById(id);
    if (!buffalo) {
      return res.status(404).json({ message: "Buffalo not found" });
    }
    res.json(buffalo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBuffalo = async (req, res) => {
  try {
    const { name, tagId, breed, age, status, purchaseDate, notes, milkCapacity } = req.body;
    const { id } = req.params;

    const updateData = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (tagId !== undefined) updateData.tagId = tagId ? String(tagId).trim() : "";
    if (breed !== undefined) updateData.breed = String(breed).trim();
    if (age !== undefined) updateData.age = Number(age);
    if (status !== undefined) updateData.status = status;
    if (purchaseDate !== undefined) updateData.purchaseDate = new Date(purchaseDate);
    if (notes !== undefined) updateData.notes = String(notes).trim();
    if (milkCapacity !== undefined) updateData.milkCapacity = Number(milkCapacity);

    const buffalo = await Buffalo.findByIdAndUpdate(id, updateData, { new: true });
    if (!buffalo) {
      return res.status(404).json({ message: "Buffalo not found" });
    }
    res.json(buffalo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBuffalo = async (req, res) => {
  try {
    const { id } = req.params;
    const buffalo = await Buffalo.findByIdAndDelete(id);
    if (!buffalo) {
      return res.status(404).json({ message: "Buffalo not found" });
    }
    res.json({ message: "Buffalo deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addBuffaloMilk = async (req, res) => {
  try {
    const { buffaloId, quantity, date } = req.body;

    if (!buffaloId) {
      return res.status(400).json({ message: "Buffalo ID is required" });
    }
    if (quantity == null || quantity < 0) {
      return res.status(400).json({ message: "Valid quantity is required" });
    }

    const buffaloMilk = await BuffaloMilk.create({
      buffaloId,
      quantity: Number(quantity),
      date: date ? new Date(date) : new Date(),
    });

    await buffaloMilk.populate("buffaloId", "name tagId breed");
    res.status(201).json(buffaloMilk);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBuffaloMilks = async (req, res) => {
  try {
    const { buffaloId } = req.params;
    const milks = await BuffaloMilk.find({ buffaloId })
      .sort({ date: -1 })
      .populate("buffaloId", "name tagId");
    res.json(milks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addBuffaloChild = async (req, res) => {
  try {
    const { buffaloId, gender, birthDate } = req.body;

    if (!buffaloId) {
      return res.status(400).json({ message: "Buffalo ID is required" });
    }
    if (!gender || !["male", "female"].includes(gender)) {
      return res.status(400).json({ message: "Valid gender (male/female) is required" });
    }
    if (!birthDate) {
      return res.status(400).json({ message: "Birth date is required" });
    }

    const child = await Child.create({
      buffaloId,
      gender,
      birthDate: new Date(birthDate),
    });

    await child.populate("buffaloId", "name tagId");
    res.status(201).json(child);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBuffaloChildren = async (req, res) => {
  try {
    const { buffaloId } = req.params;
    const children = await Child.find({ buffaloId }).sort({ birthDate: -1 });
    res.json(children);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addBuffaloExpense = async (req, res) => {
  try {
    const { buffaloId, type, amount, date, description } = req.body;

    if (!buffaloId) {
      return res.status(400).json({ message: "Buffalo ID is required" });
    }
    if (!type || !["feed", "medical", "maintenance", "other"].includes(type)) {
      return res.status(400).json({ message: "Valid expense type is required" });
    }
    if (amount == null || amount < 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const expense = await BuffaloExpense.create({
      buffaloId,
      type,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      description: description ? String(description).trim() : "",
    });

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBuffaloExpenses = async (req, res) => {
  try {
    const { buffaloId } = req.params;
    const expenses = await BuffaloExpense.find({ buffaloId })
      .sort({ date: -1 });
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    res.json({ expenses, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addDeworming = async (req, res) => {
  try {
    const { buffaloId, childId, date, notes } = req.body;

    if (!buffaloId && !childId) {
      return res.status(400).json({ message: "Buffalo ID or Child ID is required" });
    }
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const deworming = await Deworming.create({
      buffaloId: buffaloId || undefined,
      childId: childId || undefined,
      date: new Date(date),
      notes: notes ? String(notes).trim() : "",
    });

    res.status(201).json(deworming);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDewormingRecords = async (req, res) => {
  try {
    const { buffaloId } = req.params;
    const records = await Deworming.find({
      $or: [{ buffaloId }, { childId: { $in: (await Child.find({ buffaloId })).map(c => c._id) } }]
    }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addMating = async (req, res) => {
  try {
    const { buffaloId, matingDate, expectedDelivery, notes } = req.body;

    if (!buffaloId) {
      return res.status(400).json({ message: "Buffalo ID is required" });
    }
    if (!matingDate || !expectedDelivery) {
      return res.status(400).json({ message: "Mating date and expected delivery are required" });
    }

    const mating = await Mating.create({
      buffaloId,
      matingDate: new Date(matingDate),
      expectedDelivery: new Date(expectedDelivery),
      notes: notes ? String(notes).trim() : "",
    });

    res.status(201).json(mating);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMatingRecords = async (req, res) => {
  try {
    const { buffaloId } = req.params;
    const matings = await Mating.find({ buffaloId })
      .sort({ matingDate: -1 });
    res.json(matings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
