const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const DeliveryAssignment = require("../models/DeliveryAssignment");
const MilkEntry = require("../models/MilkEntry");
const User = require("../models/User");

const normalizePhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "";
};

const isValidPassword = (password) =>
  typeof password === "string" &&
  password.length >= 8 &&
  password.length <= 128 &&
  /[A-Z]/.test(password) &&
  /[0-9]/.test(password);

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const hasCustomerAssignment = async (deliveryManId, customerId) => Boolean(
  await DeliveryAssignment.exists({ deliveryManId, customerId, isActive: true })
);

const isActiveCustomer = async (customerId) => Boolean(
  await User.exists({ _id: customerId, role: "customer", isActive: true })
);

const serializeCustomer = (customer) => ({
  _id: customer._id,
  name: customer.name || customer.username,
  username: customer.username,
  phone: customer.phone || null,
  email: customer.email || null,
  isActive: customer.isActive,
});

const normalizeAccessModule = (value) => {
  const moduleName = String(value || "").trim().toLowerCase();
  if (["milk_entry", "customer_management"].includes(moduleName)) {
    return moduleName;
  }
  return null;
};

const serializePermission = (permission) => {
  if (!permission) return null;
  const moduleName = normalizeAccessModule(permission.module);
  if (!moduleName) return null;

  return {
    module: moduleName,
    label: moduleName === "milk_entry" ? "Milk Entry" : "Customer Management",
    customerLimit: Number(permission.customerLimit) || 0,
    canWrite: permission.canWrite !== false,
    isActive: permission.isActive !== false,
    grantedAt: permission.grantedAt || new Date().toISOString(),
    grantedBy: permission.grantedBy || null,
  };
};

exports.getDeliveryUserById = async (req, res) => {
  try {
    const { deliveryManId } = req.params;
    if (!isValidId(deliveryManId)) {
      return res.status(400).json({ message: "Invalid delivery user ID" });
    }

    const user = await User.findOne({ _id: deliveryManId, role: "milk_delivery_man" })
      .select("_id name username phone isActive createdAt updatedAt deliveryPermissions")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "Delivery user not found" });
    }

    const permissions = Array.isArray(user.deliveryPermissions)
      ? user.deliveryPermissions.map(serializePermission).filter(Boolean)
      : [];

    return res.json({
      ...user,
      permissions,
    });
  } catch (error) {
    console.error("Failed to fetch delivery user:", error);
    return res.status(500).json({ message: "Failed to load delivery user" });
  }
};

exports.grantDeliveryAccess = async (req, res) => {
  try {
    const { deliveryManId } = req.params;
    const moduleName = normalizeAccessModule(req.body.module);
    const customerLimit = Number(req.body.customerLimit ?? req.body.limit ?? 0);

    if (!isValidId(deliveryManId)) {
      return res.status(400).json({ message: "Invalid delivery user ID" });
    }
    if (!moduleName) {
      return res.status(400).json({ message: "A valid module is required" });
    }
    if (!Number.isFinite(customerLimit) || customerLimit < 0) {
      return res.status(400).json({ message: "Customer limit must be zero or greater" });
    }

    const deliveryUser = await User.findOne({ _id: deliveryManId, role: "milk_delivery_man" });
    if (!deliveryUser) {
      return res.status(404).json({ message: "Delivery user not found" });
    }

    const existingPermissions = Array.isArray(deliveryUser.deliveryPermissions) ? deliveryUser.deliveryPermissions : [];
    const nextPermissions = existingPermissions.filter((permission) => normalizeAccessModule(permission.module) !== moduleName);
    const nextPermission = {
      module: moduleName,
      label: moduleName === "milk_entry" ? "Milk Entry" : "Customer Management",
      customerLimit,
      canWrite: req.body.canWrite !== false,
      isActive: true,
      grantedBy: req.user?.id || null,
      grantedAt: new Date(),
    };

    deliveryUser.deliveryPermissions = [...nextPermissions, nextPermission];
    await deliveryUser.save();

    return res.status(201).json({
      permission: serializePermission(nextPermission),
      permissions: deliveryUser.deliveryPermissions.map(serializePermission).filter(Boolean),
    });
  } catch (error) {
    console.error("Failed to grant delivery access:", error);
    return res.status(500).json({ message: "Failed to grant access" });
  }
};

exports.deleteDeliveryUser = async (req, res) => {
  try {
    const { deliveryManId } = req.params;

    if (!isValidId(deliveryManId)) {
      return res.status(400).json({ message: "Invalid delivery user ID" });
    }

    const deletedUser = await User.findOneAndDelete({
      _id: deliveryManId,
      role: "milk_delivery_man",
    });

    if (!deletedUser) {
      return res.status(404).json({ message: "Delivery user not found" });
    }

    await DeliveryAssignment.deleteMany({ deliveryManId });

    return res.json({
      success: true,
      message: "Delivery man profile deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete delivery user:", error);
    return res.status(500).json({ message: "Failed to delete delivery user" });
  }
};

exports.createDeliveryUser = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const phone = normalizePhone(req.body.phone);
    const password = req.body.password;

    if (!name || name.length > 80 || !phone || !isValidPassword(password)) {
      return res.status(400).json({
        message: "Provide a name, valid phone number, and password with 8+ characters, an uppercase letter, and a number.",
      });
    }

    if (await User.exists({ phone })) {
      return res.status(409).json({ message: "Phone number is already registered." });
    }

    const baseUsername = name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) || "delivery";
    let username = baseUsername;
    let suffix = 1;
    while (await User.exists({ username })) {
      username = `${baseUsername}${suffix}`;
      suffix += 1;
    }

    const user = await User.create({
      name,
      username,
      phone,
      password: await bcrypt.hash(password, 12),
      role: "milk_delivery_man",
      isActive: true,
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error("Failed to create milk delivery account:", error);
    return res.status(500).json({ message: "Failed to create delivery account" });
  }
};

exports.listDeliveryUsers = async (req, res) => {
  try {
    const [users, assignments] = await Promise.all([
      User.find({ role: "milk_delivery_man" })
      .select("_id name username phone isActive createdAt deliveryPermissions")
      .sort({ name: 1 })
      .lean(),
      DeliveryAssignment.find({ isActive: true }).select("deliveryManId customerId").lean(),
    ]);
    const assignedByUser = new Map();
    assignments.forEach(({ deliveryManId, customerId }) => {
      const key = String(deliveryManId);
      const assigned = assignedByUser.get(key) || [];
      assigned.push(String(customerId));
      assignedByUser.set(key, assigned);
    });
    return res.json(users.map((user) => ({
      ...user,
      permissions: Array.isArray(user.deliveryPermissions)
        ? user.deliveryPermissions.map(serializePermission).filter(Boolean)
        : [],
      assignedCustomerIds: assignedByUser.get(String(user._id)) || [],
    })));
  } catch (error) {
    console.error("Failed to list milk delivery accounts:", error);
    return res.status(500).json({ message: "Failed to load delivery accounts" });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const { deliveryManId } = req.params;
    if (!isValidId(deliveryManId)) return res.status(400).json({ message: "Invalid delivery user ID" });

    const deliveryUser = await User.findOne({ _id: deliveryManId, role: "milk_delivery_man" }).select("_id");
    if (!deliveryUser) return res.status(404).json({ message: "Delivery user not found" });

    const assignments = await DeliveryAssignment.find({ deliveryManId, isActive: true })
      .select("customerId")
      .lean();
    return res.json(assignments.map((assignment) => String(assignment.customerId)));
  } catch (error) {
    console.error("Failed to load delivery assignments:", error);
    return res.status(500).json({ message: "Failed to load assignments" });
  }
};

exports.replaceAssignments = async (req, res) => {
  try {
    const { deliveryManId } = req.params;
    const customerIds = req.body.customerIds;
    if (!isValidId(deliveryManId) || !Array.isArray(customerIds)) {
      return res.status(400).json({ message: "A valid delivery user and customer ID list are required" });
    }

    const deliveryUser = await User.findOne({ _id: deliveryManId, role: "milk_delivery_man" }).select("_id");
    if (!deliveryUser) return res.status(404).json({ message: "Delivery user not found" });

    const uniqueCustomerIds = [...new Set(customerIds.map(String))];
    if (uniqueCustomerIds.some((id) => !isValidId(id))) {
      return res.status(400).json({ message: "One or more customer IDs are invalid" });
    }

    const validCustomers = await User.countDocuments({
      _id: { $in: uniqueCustomerIds },
      role: "customer",
    });
    if (validCustomers !== uniqueCustomerIds.length) {
      return res.status(400).json({ message: "Assignments can only be made to existing customers" });
    }

    await DeliveryAssignment.updateMany(
      { deliveryManId, isActive: true, customerId: { $nin: uniqueCustomerIds } },
      { $set: { isActive: false, unassignedAt: new Date() } }
    );

    if (uniqueCustomerIds.length) {
      await DeliveryAssignment.bulkWrite(uniqueCustomerIds.map((customerId) => ({
        updateOne: {
          filter: { deliveryManId, customerId },
          update: {
            $set: { isActive: true, assignedBy: req.user.id, unassignedAt: null },
            $setOnInsert: { assignedAt: new Date() },
          },
          upsert: true,
        },
      })));
    }

    return res.json({ customerIds: uniqueCustomerIds });
  } catch (error) {
    console.error("Failed to update delivery assignments:", error);
    return res.status(500).json({ message: "Failed to update assignments" });
  }
};

exports.listAssignedCustomers = async (req, res) => {
  try {
    const assignments = await DeliveryAssignment.find({ deliveryManId: req.user.id, isActive: true })
      .select("customerId")
      .lean();
    const customerIds = assignments.map((assignment) => assignment.customerId);
    const customers = await User.find({ _id: { $in: customerIds }, role: "customer", isActive: true })
      .select("_id name username phone email isActive")
      .sort({ name: 1, username: 1 })
      .lean();
    return res.json(customers.map(serializeCustomer));
  } catch (error) {
    console.error("Failed to load assigned customers:", error);
    return res.status(500).json({ message: "Failed to load assigned customers" });
  }
};

exports.getAssignedCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!isValidId(customerId)) return res.status(400).json({ message: "Invalid customer ID" });
    if (!(await hasCustomerAssignment(req.user.id, customerId))) {
      return res.status(403).json({ message: "Customer is not assigned to this delivery account" });
    }
    if (!(await isActiveCustomer(customerId))) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const customer = await User.findOne({ _id: customerId, role: "customer", isActive: true })
      .select("_id name username phone email isActive createdAt")
      .lean();
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    return res.json(serializeCustomer(customer));
  } catch (error) {
    console.error("Failed to load assigned customer:", error);
    return res.status(500).json({ message: "Failed to load customer" });
  }
};

exports.getAssignedMilkHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!isValidId(customerId)) return res.status(400).json({ message: "Invalid customer ID" });
    if (!(await hasCustomerAssignment(req.user.id, customerId))) {
      return res.status(403).json({ message: "Customer is not assigned to this delivery account" });
    }
    if (!(await isActiveCustomer(customerId))) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const [entries, total] = await Promise.all([
      MilkEntry.find({ userId: customerId })
        .select("_id userId quantity pricePerLitre totalPrice session date entryType notes createdAt")
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      MilkEntry.countDocuments({ userId: customerId }),
    ]);

    return res.json({ entries, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Failed to load assigned milk history:", error);
    return res.status(500).json({ message: "Failed to load milk history" });
  }
};

exports.getAllAssignedMilkHistory = async (req, res) => {
  try {
    const assignments = await DeliveryAssignment.find({ deliveryManId: req.user.id, isActive: true })
      .select("customerId")
      .lean();
    const assignedIds = assignments.map((assignment) => assignment.customerId);
    const activeCustomers = await User.find({
      _id: { $in: assignedIds },
      role: "customer",
      isActive: true,
    }).select("_id").lean();
    const customerIds = activeCustomers.map((customer) => customer._id);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const [entries, total] = await Promise.all([
      MilkEntry.find({ userId: { $in: customerIds } })
        .select("_id userId quantity pricePerLitre totalPrice session date entryType notes createdAt")
        .populate("userId", "name username phone")
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      MilkEntry.countDocuments({ userId: { $in: customerIds } }),
    ]);

    return res.json({ entries, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Failed to load assigned milk history:", error);
    return res.status(500).json({ message: "Failed to load milk history" });
  }
};

exports.createAssignedMilkEntry = async (req, res) => {
  try {
    const { userId, quantity, pricePerLitre, session, date, notes } = req.body;
    if (!isValidId(userId)) return res.status(400).json({ message: "Invalid customer ID" });
    if (!(await hasCustomerAssignment(req.user.id, userId))) {
      return res.status(403).json({ message: "Customer is not assigned to this delivery account" });
    }
    if (!(await isActiveCustomer(userId))) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const amount = Number(quantity);
    const price = Number(pricePerLitre);
    const entryDate = new Date(date);
    if (!MilkEntry.ALLOWED_QUANTITIES.includes(amount)) {
      return res.status(400).json({ message: "Invalid milk quantity" });
    }
    if (!MilkEntry.ALLOWED_PRICES.includes(price)) {
      return res.status(400).json({ message: "Invalid milk price" });
    }
    if (!["morning", "evening"].includes(session)) {
      return res.status(400).json({ message: "Invalid delivery session" });
    }
    if (!date || Number.isNaN(entryDate.getTime())) {
      return res.status(400).json({ message: "A valid entry date is required" });
    }

    entryDate.setHours(0, 0, 0, 0);
    const entry = await MilkEntry.create({
      userId,
      createdBy: req.user.id,
      quantity: amount,
      pricePerLitre: price,
      totalPrice: amount * price,
      session,
      date: entryDate,
      entryType: "NORMAL",
      notes: String(notes || "").slice(0, 500),
    });

    return res.status(201).json({ entry });
  } catch (error) {
    console.error("Failed to create assigned milk entry:", error);
    return res.status(500).json({ message: "Failed to create milk entry" });
  }
};