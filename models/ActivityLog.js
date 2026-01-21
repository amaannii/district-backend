import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },

    userName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["Admin", "User"],
      required: true,
    },

    action: {
      type: String,
      required: true,
      // examples:
      // LOGIN, LOGOUT, BLOCK_USER, UNBLOCK_USER, CREATE_POST, DELETE_USER
    },

    description: {
      type: String,
    },

    ip: {
      type: String,
    },

    device: {
      type: String,
    },
    time:{
        type:Date,
    }
  },
  { timestamps: true } // createdAt = activity time
);

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
