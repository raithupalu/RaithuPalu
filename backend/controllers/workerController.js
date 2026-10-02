const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const User = require("../models/User");
const WorkerAttendance = require("../models/WorkerAttendance");

const VALID_WORK_TYPES = ["Milk Labour", "Buffalo Keeper"];
const TASK_SEQUENCE = ["GRAZING_START", "LUNCH_BEFORE", "LUNCH_AFTER", "GRAZING_END"];
const TASK_LABELS = {
  GRAZING_START: "Start Grazing",
  LUNCH_BEFORE: "Before Lunch",
  LUNCH_AFTER: "After Lunch",
  GRAZING_END: "End Grazing",
};

const serializeTaskDetails = (taskState = {}) => ({
  completed: Boolean(taskState?.completed),
  photoUrl: taskState?.photoUrl || "",
  timestamp: taskState?.timestamp ? new Date(taskState.timestamp).toISOString() : null,
});

const serializeAttendanceRecord = (record = {}) => ({
  date: record.date || null,
  workType: record.workType || "Buffalo Keeper",
  attendanceStatus: record.attendance?.status || "PENDING",
  completedAt: record.attendance?.completedAt ? new Date(record.attendance.completedAt).toISOString() : null,
  progress: TASK_SEQUENCE.filter((taskKey) => Boolean(record.tasks?.[taskKey]?.completed)).length,
  total: TASK_SEQUENCE.length,
  tasks: Object.fromEntries(
    TASK_SEQUENCE.map((taskKey) => [taskKey, serializeTaskDetails(record.tasks?.[taskKey])])
  ),
});

const normalizePhone = (phone) => {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  return null;
};

const getBusinessDateInKolkata = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const map = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  return `${map.year}-${map.month}-${map.day}`;
};

const getTaskStatusForDate = async (workerId, date) => {
  let record = await WorkerAttendance.findOne({ workerId, date }).lean();

  if (!record) {
    record = {
      workerId,
      date,
      workType: "Buffalo Keeper",
      tasks: {
        GRAZING_START: { completed: false, photoUrl: "", timestamp: null },
        LUNCH_BEFORE: { completed: false, photoUrl: "", timestamp: null },
        LUNCH_AFTER: { completed: false, photoUrl: "", timestamp: null },
        GRAZING_END: { completed: false, photoUrl: "", timestamp: null },
      },
      attendance: { status: "PENDING", completedAt: null },
    };
  }

  return record;
};

const buildSafeWorker = (user) => ({
  _id: user._id,
  name: user.name || user.username || "",
  username: user.username || null,
  phone: user.phone || null,
  workType: user.workType || null,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

const recalculateAttendance = (tasks) => {
  const completedCount = TASK_SEQUENCE.filter((taskKey) => Boolean(tasks[taskKey]?.completed)).length;

  if (completedCount === TASK_SEQUENCE.length) {
    return {
      status: "PRESENT",
      completedAt: new Date(),
    };
  }

  return {
    status: "PENDING",
    completedAt: null,
  };
};

const ensureValidTaskType = (taskType) => {
  const normalized = String(taskType || "").trim();
  if (!TASK_SEQUENCE.includes(normalized)) {
    return null;
  }
  return normalized;
};

const ensureWorkerName = (name) => {
  const clean = String(name || "").trim();
  if (!clean) return null;
  return clean;
};

const getNextTaskKey = (tasks = {}) => {
  for (const taskKey of TASK_SEQUENCE) {
    if (!tasks?.[taskKey]?.completed) {
      return taskKey;
    }
  }

  return null;
};

const getLocalWorkerPhotoFilePath = (photoUrl) => {
  if (!photoUrl || typeof photoUrl !== "string") return null;

  const trimmed = photoUrl.trim();
  if (!trimmed || !trimmed.includes("/uploads/workers/")) {
    return null;
  }

  const relativePath = trimmed.replace(/^\/+/, "");
  const candidatePath = path.join(__dirname, "..", relativePath);

  if (!candidatePath.includes(path.join(__dirname, "..", "uploads", "workers"))) {
    return null;
  }

  return candidatePath;
};

const removeWorkerPhotoFiles = async (workerId) => {
  try {
    const records = await WorkerAttendance.find({ workerId }).lean();
    const photoPaths = new Set();

    records.forEach((record) => {
      if (!record?.tasks) return;

      Object.values(record.tasks).forEach((taskState) => {
        if (!taskState?.photoUrl) return;
        const filePath = getLocalWorkerPhotoFilePath(taskState.photoUrl);
        if (filePath) photoPaths.add(filePath);
      });
    });

    await Promise.all(
      [...photoPaths].map(async (filePath) => {
        try {
          await fs.promises.access(filePath);
          await fs.promises.unlink(filePath);
        } catch (error) {
          if (error.code !== "ENOENT") {
            console.warn(`Failed to remove worker photo for ${workerId}:`, error.message);
          }
        }
      })
    );
  } catch (error) {
    console.warn(`Worker photo cleanup failed for ${workerId}:`, error.message);
  }
};

const getMonthWindow = (monthKey) => {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
    const businessToday = new Date();
    const year = businessToday.getFullYear();
    const monthIndex = businessToday.getMonth();
    const start = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
    const endDate = new Date(year, monthIndex + 1, 0);
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
    return { start, end };
  }

  const [year, month] = monthKey.split("-").map(Number);
  const start = `${String(year)}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0);
  const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
  return { start, end };
};

exports.getWorkers = async (req, res) => {
  try {
    const workers = await User.find({ role: "worker" })
      .select("_id name username phone workType role isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(workers.map(buildSafeWorker));
  } catch (error) {
    console.error("Error fetching workers:", error);
    return res.status(500).json({ message: "Failed to fetch workers" });
  }
};

exports.deleteWorker = async (req, res) => {
  try {
    const { workerId } = req.params;

    if (!workerId || !mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ success: false, message: "Invalid worker id" });
    }

    const targetWorker = await User.findById(workerId).select("_id name username phone workType role").lean();
    if (!targetWorker) {
      return res.status(404).json({ success: false, message: "Worker not found" });
    }

    if (String(targetWorker.role).toLowerCase() !== "worker") {
      return res.status(400).json({ success: false, message: "Only worker accounts can be deleted via this endpoint" });
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await WorkerAttendance.deleteMany({ workerId: targetWorker._id }).session(session);
        await removeWorkerPhotoFiles(targetWorker._id.toString());
        await User.deleteOne({ _id: targetWorker._id }).session(session);
      });
    } finally {
      await session.endSession();
    }

    return res.json({ success: true, message: "Worker deleted successfully" });
  } catch (error) {
    console.error("Error deleting worker:", error);
    return res.status(500).json({ success: false, message: "Failed to delete worker" });
  }
};

exports.getWorkerAttendanceHistory = async (req, res) => {
  try {
    const workerId = req.params.id;
    if (!workerId || !mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ message: "Invalid worker id" });
    }

    const worker = await User.findById(workerId).select("_id name username phone workType role").lean();
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const monthKey = req.query.month || getBusinessDateInKolkata().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(String(monthKey))) {
      return res.status(400).json({ message: "Month must be in YYYY-MM format" });
    }

    const { start, end } = getMonthWindow(String(monthKey));

    const records = await WorkerAttendance.find({
      workerId: worker._id,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 }).lean();

    return res.json({
      success: true,
      worker: buildSafeWorker(worker),
      month: String(monthKey),
      records: records.map((record) => serializeAttendanceRecord(record)),
    });
  } catch (error) {
    console.error("Error fetching worker attendance history:", error);
    return res.status(500).json({ message: "Failed to fetch worker attendance history" });
  }
};

exports.getWorkerAttendanceByDate = async (req, res) => {
  try {
    const workerId = req.params.id;
    if (!workerId || !mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ message: "Invalid worker id" });
    }

    const worker = await User.findById(workerId).select("_id name username phone workType role").lean();
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const dateKey = req.params.date;
    const record = await WorkerAttendance.findOne({ workerId: worker._id, date: dateKey }).lean();

    if (!record) {
      return res.status(404).json({ message: "No attendance record found for this date" });
    }

    return res.json({
      success: true,
      worker: buildSafeWorker(worker),
      date: dateKey,
      record: serializeAttendanceRecord(record),
    });
  } catch (error) {
    console.error("Error fetching worker attendance by date:", error);
    return res.status(500).json({ message: "Failed to fetch worker attendance for this date" });
  }
};

exports.createWorker = async (req, res) => {
  try {
    const { name, workType, phone, password } = req.body;

    const cleanName = ensureWorkerName(name);
    if (!cleanName) {
      return res.status(400).json({ message: "Name is required." });
    }

    if (!VALID_WORK_TYPES.includes(workType)) {
      return res.status(400).json({ message: "Work type must be Milk Labour or Buffalo Keeper." });
    }

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({ message: "Please provide a valid phone number." });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const existingPhone = await User.findOne({ phone: cleanPhone });
    if (existingPhone) {
      return res.status(409).json({ message: "Phone number is already registered." });
    }

    let usernameBase = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) || `worker${Date.now()}`;
    let username = usernameBase;
    let counter = 1;

    while (await User.findOne({ username })) {
      username = `${usernameBase}${counter}`;
      counter += 1;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const worker = await User.create({
      name: cleanName,
      username,
      phone: cleanPhone,
      password: hashedPassword,
      role: "worker",
      workType,
      isActive: true,
    });

    return res.status(201).json({
      message: "Worker created successfully",
      worker: buildSafeWorker(worker.toObject ? worker.toObject() : worker),
    });
  } catch (error) {
    console.error("Error creating worker:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || "field";
      return res.status(409).json({ message: `${field} already exists.` });
    }
    return res.status(500).json({ message: "Failed to create worker" });
  }
};

exports.getWorkerById = async (req, res) => {
  try {
    const workerId = req.params.id;
    if (!workerId || !mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ message: "Invalid worker id" });
    }

    if (req.query && req.query.month) {
      const monthKey = String(req.query.month).trim();
      if (!/^\d{4}-\d{2}$/.test(monthKey)) {
        return res.status(400).json({ message: "Month must be in YYYY-MM format" });
      }

      const worker = await User.findById(workerId)
        .select("_id name username phone workType role isActive createdAt")
        .lean();

      if (!worker) {
        return res.status(404).json({ message: "Worker not found" });
      }

      const { start, end } = getMonthWindow(monthKey);
      const records = await WorkerAttendance.find({
        workerId: worker._id,
        date: { $gte: start, $lte: end },
      }).sort({ date: 1 }).lean();

      return res.json({
        success: true,
        worker: buildSafeWorker(worker),
        month: monthKey,
        records: records.map((record) => serializeAttendanceRecord(record)),
      });
    }

    const worker = await User.findById(workerId)
      .select("_id name username phone workType role isActive createdAt")
      .lean();

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const businessDate = getBusinessDateInKolkata();
    const attendance = await getTaskStatusForDate(worker._id, businessDate);

    return res.json({
      worker: buildSafeWorker(worker),
      attendance: serializeAttendanceRecord(attendance),
      today: {
        date: businessDate,
        attendanceStatus: attendance.attendance?.status || "PENDING",
        progress: TASK_SEQUENCE.filter((taskKey) => Boolean(attendance.tasks?.[taskKey]?.completed)).length,
        total: TASK_SEQUENCE.length,
      },
    });
  } catch (error) {
    console.error("Error fetching worker details:", error);
    return res.status(500).json({ message: "Failed to fetch worker details" });
  }
};

exports.getMyWorkerProfile = async (req, res) => {
  try {
    const worker = await User.findById(req.user.id)
      .select("_id name username phone workType role isActive createdAt")
      .lean();

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    return res.json({ worker: buildSafeWorker(worker) });
  } catch (error) {
    console.error("Error fetching worker profile:", error);
    return res.status(500).json({ message: "Failed to fetch worker profile" });
  }
};

exports.getMyTaskStatus = async (req, res) => {
  try {
    const worker = await User.findById(req.user.id).select("_id workType name").lean();
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const businessDate = getBusinessDateInKolkata();
    const attendance = await getTaskStatusForDate(worker._id, businessDate);
    const completedCount = TASK_SEQUENCE.filter((taskKey) => attendance.tasks?.[taskKey]?.completed).length;
    const nextTask = getNextTaskKey(attendance.tasks || {});

    return res.json({
      date: businessDate,
      workType: worker.workType,
      workerName: worker.name,
      attendanceStatus: attendance.attendance?.status || "PENDING",
      completedTasks: completedCount,
      totalTasks: TASK_SEQUENCE.length,
      progress: completedCount,
      total: TASK_SEQUENCE.length,
      nextTask,
      tasks: TASK_SEQUENCE.map((taskKey) => ({
        taskKey,
        label: TASK_LABELS[taskKey],
        completed: Boolean(attendance.tasks?.[taskKey]?.completed),
        photoUrl: attendance.tasks?.[taskKey]?.photoUrl || "",
        timestamp: attendance.tasks?.[taskKey]?.timestamp || null,
        isAvailable: nextTask === taskKey && !attendance.tasks?.[taskKey]?.completed,
        isLocked: !attendance.tasks?.[taskKey]?.completed && taskKey !== nextTask,
      })),
    });
  } catch (error) {
    console.error("Error fetching task status:", error);
    return res.status(500).json({ message: "Failed to fetch today's tasks" });
  }
};

exports.submitWorkerTask = async (req, res) => {
  try {
    const worker = await User.findById(req.user.id).select("_id workType name").lean();
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    if (worker.workType !== "Buffalo Keeper") {
      return res.status(403).json({ message: "Only Buffalo Keepers can submit daily tasks." });
    }

    const taskType = ensureValidTaskType(req.params.taskType);
    if (!taskType) {
      return res.status(400).json({ message: "Invalid task type." });
    }

    if (!req.file || !req.file.filename) {
      return res.status(400).json({ message: "A photo is required for this task." });
    }

    const businessDate = getBusinessDateInKolkata();
    let record = await WorkerAttendance.findOne({ workerId: worker._id, date: businessDate });

    if (!record) {
      record = new WorkerAttendance({
        workerId: worker._id,
        date: businessDate,
        workType: worker.workType,
        tasks: {
          GRAZING_START: { completed: false, photoUrl: "", timestamp: null },
          LUNCH_BEFORE: { completed: false, photoUrl: "", timestamp: null },
          LUNCH_AFTER: { completed: false, photoUrl: "", timestamp: null },
          GRAZING_END: { completed: false, photoUrl: "", timestamp: null },
        },
        attendance: { status: "PENDING", completedAt: null },
      });
    }

    if (record.tasks[taskType]?.completed) {
      return res.status(409).json({ message: `${TASK_LABELS[taskType]} has already been completed today.` });
    }

    const nextTask = getNextTaskKey(record.tasks || {});
    if (taskType !== nextTask) {
      return res.status(400).json({
        message: `${TASK_LABELS[taskType]} is not the next valid task. Next task: ${nextTask ? TASK_LABELS[nextTask] : "None"}.`,
      });
    }

    const relativePhotoPath = `/uploads/workers/${req.file.filename}`;
    record.tasks[taskType] = {
      completed: true,
      photoUrl: relativePhotoPath,
      timestamp: new Date(),
    };

    const completedCount = TASK_SEQUENCE.filter((key) => record.tasks[key]?.completed).length;
    const attendanceStatus = completedCount === TASK_SEQUENCE.length ? "PRESENT" : "PENDING";
    record.attendance = {
      status: attendanceStatus,
      completedAt: attendanceStatus === "PRESENT" ? new Date() : null,
    };

    await record.save();

    return res.status(201).json({
      message: `${TASK_LABELS[taskType]} completed successfully`,
      task: taskType,
      attendanceStatus,
      progress: completedCount,
      total: TASK_SEQUENCE.length,
      photoUrl: relativePhotoPath,
    });
  } catch (error) {
    console.error("Error submitting worker task:", error);

    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn("Failed to clean uploaded file after task error:", cleanupError.message);
      }
    }

    return res.status(500).json({ message: "Failed to save daily task" });
  }
};
