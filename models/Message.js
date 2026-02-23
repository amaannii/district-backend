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
  message: {
  type: Object,
  required: true,
},
  },
  { timestamps: true } // adds createdAt automatically
);

const Message = mongoose.model("Message", messageSchema);

export default Message;