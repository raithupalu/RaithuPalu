const mongoose = require("mongoose");
const MilkEntry = require("../models/MilkEntry");
const User = require("../models/User");

const { ALLOWED_QUANTITIES, ALLOWED_PRICES } = MilkEntry;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.addMilkEntry = async (req, res, next) => {
  try {
    const { userId, quantity, pricePerLitre, session, date, notes } = req.body;

    if (!userId || quantity == null || pricePerLitre == null || !session || !date) {
      const err = new Error("Please provide userId, quantity, pricePerLitre, session, and date");
      err.status = 400;
      throw err;
    }

    if (!isValidObjectId(userId)) {
      const err = new Error("Invalid customer id");
      err.status = 400;
      throw err;
    }

    const q = Number(quantity);
    if (Number.isNaN(q) || !ALLOWED_QUANTITIES.includes(q)) {
      const err = new Error(`Quantity must be one of: ${ALLOWED_QUANTITIES.join(", ")} L`);
      err.status = 400;
      throw err;
    }

    const price = Number(pricePerLitre);
    if (Number.isNaN(price) || !ALLOWED_PRICES.includes(price)) {
      const err = new Error(`Price per litre must be one of: ${ALLOWED_PRICES.join(", ")}`);
      err.status = 400;
      throw err;
    }

    if (!["morning", "evening"].includes(session)) {
      const err = new Error("Session must be morning or evening");
      err.status = 400;
      throw err;
    }

    const totalPrice = q * price;

    // normalize stored date to start of the day to avoid timezone mismatches
    const entryDate = new Date(date);
    entryDate.setHours(0, 0, 0, 0);

    const entry = await MilkEntry.create({
      userId,
      quantity: q,
      pricePerLitre: price,
      totalPrice,
      session,
      date: entryDate,
      entryType: "NORMAL",
      notes,
    });

    console.log(`[DEBUG] MilkEntry created:\nCustomer: ${userId}\nOrder ID: N/A (Manual Entry)\nentryType: NORMAL`);

    res.status(201).json({ 
      message: "Milk entry added", 
      entry: {
        ...entry.toObject(),
        entryType: entry.entryType || "NORMAL"
      } 
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyMilkEntries = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      MilkEntry.find({ userId: req.user.id }).sort({ date: -1 }).skip(skip).limit(limit),
      MilkEntry.countDocuments({ userId: req.user.id }),
    ]);

    const processedEntries = entries.map(entry => {
      const obj = entry.toObject ? entry.toObject() : entry;
      return {
        ...obj,
        entryType: obj.entryType || "NORMAL"
      };
    });

    res.json({
      success: true,
      data: processedEntries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllMilkEntries = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 100, 2000);
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      MilkEntry.find()
        .populate("userId", "username phone")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      MilkEntry.countDocuments(),
    ]);

    const processedEntries = entries.map(entry => {
      const obj = entry.toObject ? entry.toObject() : entry;
      return {
        ...obj,
        entryType: obj.entryType || "NORMAL"
      };
    });

    res.json({
      data: processedEntries,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getLastMilkEntryForUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      const err = new Error("Invalid user id");
      err.status = 400;
      throw err;
    }

    if (req.user.role !== "admin" && String(req.user.id) !== String(id)) {
      const err = new Error("Access denied");
      err.status = 403;
      throw err;
    }

    const data = await MilkEntry.findOne({ userId: id }).sort({ date: -1 });
    
    if (data) {
      const obj = data.toObject ? data.toObject() : data;
      res.json({
        ...obj,
        entryType: obj.entryType || "NORMAL"
      });
    } else {
      res.json(null);
    }
  } catch (error) {
    next(error);
  }
};

exports.deleteMilkEntry = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      const err = new Error("Invalid entry id");
      err.status = 400;
      throw err;
    }

    const deleted = await MilkEntry.findByIdAndDelete(id);
    if (!deleted) {
      const err = new Error("Entry not found");
      err.status = 404;
      throw err;
    }

    res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getMilkByUserAndMonth = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { month } = req.query;

    if (!isValidObjectId(userId)) {
      const err = new Error("Invalid user id");
      err.status = 400;
      throw err;
    }

    if (req.user.role !== "admin" && String(req.user.id) !== String(userId)) {
      const err = new Error("Access denied");
      err.status = 403;
      throw err;
    }

    if (!month) {
      const err = new Error("Month parameter required (YYYY-MM)");
      err.status = 400;
      throw err;
    }

    const [year, monthNum] = month.split("-").map(Number);
    if (Number.isNaN(year) || Number.isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      const err = new Error("Invalid month format. Use YYYY-MM");
      err.status = 400;
      throw err;
    }

    // normalize to start/end of day to avoid timezone gaps
    const startDate = new Date(year, monthNum - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, monthNum, 0);
    endDate.setHours(23, 59, 59, 999);

    console.info(`Get milk by month: user=${userId} month=${month} start=${startDate.toISOString()} end=${endDate.toISOString()}`);

    const [entries, user] = await Promise.all([
      MilkEntry.find({ userId, date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 }).lean(),
      User.findById(userId).select("username email phone").lean(),
    ]);

    console.info(`Found ${entries.length} milk entries for ${userId} in ${month}`);

    const processedEntries = entries.map(item => ({
      ...item,
      entryType: item.entryType || "NORMAL"
    }));

    const totalLitres = processedEntries.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalPrice = processedEntries.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    const customer = user
      ? { username: user.username, email: user.email, phone: user.phone }
      : { username: "Unknown" };

    res.json({
      success: true,
      customer,
      month,
      entries: processedEntries || [],
      totals: {
        totalLitres: totalLitres || 0,
        totalPrice: totalPrice || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
