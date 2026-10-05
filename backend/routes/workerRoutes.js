const express = require("express");
const multer = require("multer");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { streamWorkerPhoto } = require("../utils/workerPhotoStorage");
const {
  getWorkers,
  createWorker,
  deleteWorker,
  getWorkerById,
  getWorkerAttendanceHistory,
  getWorkerAttendanceByDate,
  getMyWorkerProfile,
  getMyTaskStatus,
  submitWorkerTask,
} = require("../controllers/workerController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  },
});

router.get("/photos/:photoId", streamWorkerPhoto);
router.get("/me", protect, authorizeRoles("worker"), getMyWorkerProfile);
router.get("/me/tasks/today", protect, authorizeRoles("worker"), getMyTaskStatus);
router.post("/me/tasks/:taskType", protect, authorizeRoles("worker"), upload.single("photo"), submitWorkerTask);

router.get("/", protect, authorizeRoles("admin"), getWorkers);
router.post("/", protect, authorizeRoles("admin"), createWorker);
router.delete("/:workerId", protect, authorizeRoles("admin"), deleteWorker);
router.get("/:id/attendance", protect, authorizeRoles("admin"), getWorkerAttendanceHistory);
router.get("/:id/attendance/:date", protect, authorizeRoles("admin"), getWorkerAttendanceByDate);
router.get("/:id", protect, authorizeRoles("admin"), getWorkerById);

module.exports = router;
