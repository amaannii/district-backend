import express from "express";
import connected from "./database/connect.js";
import dotenv from "dotenv";
import cors from "cors";
import userrouter from "./Routes/user.js";
import adminrouter from "./Routes/admin.js";
import http from "http";
import { Server } from "socket.io";
import message from "./Routes/messages.js";
import Message from "./models/Message.js";

dotenv.config();

/* ================= APP SETUP ================= */

const app = express();

// Connect Database
connected;

// Middleware
app.use(express.json());

// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//   }),
// );

app.use(
  cors({
    origin:[ "https://district-frontend.onrender.com", "https://district-frontend.onrender.com/",],
    credentials: true,
  }),
);

/* ================= ROUTES ================= */

app.use("/admin", adminrouter);
app.use("/user", userrouter);
app.use("/messages", message);

/* ================= SOCKET.IO SETUP ================= */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://district-frontend.onrender.com",
    credentials: true,
  },
  // cors: {
  //   origin: "http://localhost:5173",
  //   credentials: true,
  // },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinDistrict", (district) => {
    socket.join(district);
  });

  // 🔥 SHARE POST TO DISTRICT
  socket.on("sharePost", async ({ district, postId, sender }) => {
    try {
      const newMessage = await Message.create({
        district,
        sender,
        type: "post",
        post: postId,
      });

      io.to(district).emit("receiveMessage", newMessage);
    } catch (error) {
      console.error("Error sharing post:", error.message);
    }
  });

  

  // 🔥 SAVE MESSAGE + EMIT
  socket.on("sendMessage", async ({ district, message, sender }) => {
    try {
      // 1️⃣ Save to MongoDB
      const newMessage = await Message.create({
        district,
        sender,
        message,
      });

      // 2️⃣ Send to all users in that district
      io.to(district).emit("receiveMessage", newMessage);
    } catch (error) {
      console.error("Error saving message:", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
