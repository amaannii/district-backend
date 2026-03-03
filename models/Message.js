import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    district: {
      type: String,
      required: true,
    },

    sender: {
      type: String, // you can later change to ObjectId
      required: true,
    },

    // 🔥 ADD THIS (VERY IMPORTANT)
    type: {
      type: String,
      enum: ["text", "image", "audio", "document", "post"],
      default: "text",
    },

    // Normal messages (text, image, etc.)
    message: {
      type: Object,
      default: null,
    },

    // 🔥 When sharing a post
    post: Object,

    // 🔥 VERY IMPORTANT (needed for username + profile image)
    postOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;