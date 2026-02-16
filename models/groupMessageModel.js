import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema(
  {
    room: { type: String, required: true },
    sender: { type: String, required: true },
    senderImage: { type: String },
    type: { type: String, required: true }, // text, image, audio, document
    content: { type: String, required: true },
    name: { type: String }, // for document name
  },
  { timestamps: true }
);

export default mongoose.model("GroupMessage", groupMessageSchema);
