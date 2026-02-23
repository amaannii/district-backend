import express from "express";
import Message from "../models/Message.js";

const message = express.Router();

// Get messages by district
message.get("/:district", async (req, res) => {
  try {
    const messages = await Message.find({
      district: req.params.district,
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default message;