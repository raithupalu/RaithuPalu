const mongoose = require("mongoose");

const taskStatusSchema = new mongoose.Schema(
  {
    completed: { type: Boolean, default: false },
    photoUrl: { type: String, default: "" },
    timestamp: { type: Date, default: null },
  },
  { _id: false }
);

const workerAttendanceSchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    workType: {
      type: String,
      enum: ["Milk Labour", "Buffalo Keeper"],
      default: "Buffalo Keeper",
    },
    tasks: {
      GRAZING_START: { type: taskStatusSchema, default: () => ({ completed: false, photoUrl: "", timestamp: null }) },
      LUNCH_BEFORE: { type: taskStatusSchema, default: () => ({ completed: false, photoUrl: "", timestamp: null }) },
      LUNCH_AFTER: { type: taskStatusSchema, default: () => ({ completed: false, photoUrl: "", timestamp: null }) },
      GRAZING_END: { type: taskStatusSchema, default: () => ({ completed: false, photoUrl: "", timestamp: null }) },
    },
    attendance: {
      status: {
        type: String,
        enum: ["PENDING", "PRESENT", "ABSENT"],
        default: "PENDING",
      },
      completedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

workerAttendanceSchema.index({ workerId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("WorkerAttendance", workerAttendanceSchema);
