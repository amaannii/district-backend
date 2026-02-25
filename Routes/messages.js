import express from "express";
import Message from "../models/Message.js";
import { getDistrictMessages } from "../controller/usercontroller.js";

const message = express.Router();

// Get messages by district
message.get("/:district", getDistrictMessages);

export default message;