import nodemailer from "nodemailer";
import dotenv from "dotenv";
import userModel from "../models/users.js";
import bcrypt from "bcrypt";
import otpModel from "../models/otp.js";
import jwt from "jsonwebtoken";
import ActivityLog from "../models/ActivityLog.js";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

const otpStore = {}; // 👈 MUST be here (top of file)

const sendotp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const otp = Math.floor(10000 + Math.random() * 90000);
  const newotp = new otpModel({
    otp: otp,
    email: email,
  });
  await newotp.save();

  console.log("OTP for", email, otp);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}. Valid for 5 minutes.`,
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

const verifyotp = async (req, res) => {
  try {
    let { email, otp } = req.body;

    // normalize email
    email = email.trim().toLowerCase();

    const otps = await otpModel.findOne({ email });
    console.log("OTP record:", otps);

    // 🔴 FIRST CHECK: OTP exists or not
    if (!otps) {
      return res.status(400).json({
        status: false,
        message: "OTP expired or not found",
      });
    }

    console.log("Frontend OTP:", otp);
    console.log("Stored OTP:", otps.otp);

    // 🔴 SECOND CHECK: OTP match
    if (otps.otp.toString() === otp.toString()) {
      await otpModel.deleteOne({ email });

      return res.json({
        status: true,
        message: "OTP verified successfully",
      });
    }

    return res.status(400).json({
      status: false,
      message: "Invalid OTP",
    });
  } catch (error) {
    console.log("VERIFY OTP ERROR:", error);

    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

const signup = async (req, res) => {
  try {
    const { email, password, username, name } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10); // ✅ await

    const users = new userModel({
      email,
      password: hashedPassword,
      username,
      name,
    });

    await users.save();

    res.json({ success: true });
  } catch (err) {
    console.log("SIGNUP ERROR:", err);
    res.status(500).json({ success: false });
  }
};

const deleteotp = async (req, res) => {
  try {
    let { email } = req.body;

    email = email.trim().toLowerCase();

    const result = await otpModel.deleteMany({ email });

    console.log("OTP delete result:", result);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "OTP not found",
      });
    }

    res.json({
      success: true,
      message: "OTP deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    if (user.isBlocked) {
      return res
        .status(403)
        .json({ success: false, message: "Your account is blocked by admin" });
    }
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const log = new ActivityLog({
      userName: user.name,
      email: email,
      role: "User",
      action: "LOGIN",
      description: "User Logged In",
      ip: req.ip,
      log: "logged in",
      device: req.headers["user-agent"],
      time: new Date(),
    });

    await log.save();

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: "User",
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      success: true,
      token,
      role: "User",
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    console.error("User login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const resetpassword = async (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  await userModel.updateOne({ email }, { $set: { password: hashedPassword } });

  res.json({ message: "Password updated successfully" });
};


// 🔹 Confirm connection
const confirmNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { status: "connected" },
      { new: true },
    );

    if (!notification)
      return res.status(404).json({ error: "Notification not found" });

    res.json({ message: "Notification confirmed", notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to confirm notification" });
  }
};

// 🔹 Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification)
      return res.status(404).json({ error: "Notification not found" });

    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

// 🔹 Add sample notifications (optional, for testing)
const addSampleNotifications = async (req, res) => {
  try {
    const sampleData = [
      {
        userId: "101",
        username: "_Lunr",
        avatar: "https://i.pravatar.cc/150?img=1",
        message: "requested to connect you.",
        date: "4d",
        status: "pending",
        group: "week",
      },
      {
        userId: "102",
        username: "yuv00_",
        avatar: "https://i.pravatar.cc/150?img=2",
        message: "Requested to connect you.",
        date: "10 Nov",
        status: "pending",
        group: "month",
      },
      {
        userId: "103",
        username: "_Kaw",
        avatar: "https://i.pravatar.cc/150?img=3",
        message: "started connected you.",
        date: "29 Nov",
        status: "connected",
        group: "earlier",
      },
    ];

    const created = await Notification.insertMany(sampleData);
    res.json({ message: "Sample notifications added", created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add sample notifications" });
  }
};

const googlelogin = async (req, res) => {
  try {
    const { name, email } = req.body;
    console.log(name, email);

    let user = await userModel.findOne({ email });
    console.log(user);

    // 🟢 USER DOES NOT EXIST → CREATE
    if (!user) {
      const newUser = new userModel({
        name,
        email,
      });

      const savedUser = await newUser.save();

      return res.status(200).json({
        status: true,
        user: savedUser,
        message: "User created via Google login",
      });
    }

    // 🟢 USER EXISTS → LOGIN SUCCESS
    return res.status(200).json({
      success: true,
      user,
      message: "Google login successful",
    });
  } catch (error) {
    console.log("GOOGLE LOGIN ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const completeProfile = async (req, res) => {
  const { password, username, email } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  let users = await userModel.updateOne(
    { email: email },
    { $set: { password: hashedPassword, username: username } },
  );
  if (users) {
    res.status(200).json({
      success: true,
      message: "updated successfully",
    });
  } else {
    res.status(500).json({
      success: false,
      message: "problem while updating",
    });
  }
};

const userdetails = async (req, res) => {
  // Access stored data from middleware
  console.log(req.user);

  const user = await userModel.findOne({ email: req.user.email });

  res.json({
    message: "User details fetched",
    user: user,
  });
};

const upload = async (req, res) => {
  const { img } = req.body;
  const { email, role } = req.user;
  console.log(img);
  console.log(email);

  const users = await userModel.updateOne(
    { email: email },
    { $set: { img: img } },
    { upsert: true },
  );
  console.log(users);

  if (users) {
    res.status(200).json({
      success: true,
    });
  } else {
    res.status(400).json({
      success: false,
    });
  }
};

const posting = async (req, res) => {
  try {
    const { image, caption } = req.body;
    const { email } = req.user;

    const user = await userModel.findOneAndUpdate(
      { email },
      {
        $push: {
          post: {
            image,
            caption,
            createdAt: new Date(),
          },
        },
      },
      { new: true, upsert: true },
    );

    res.status(200).json({
      success: true,
      post: user.post,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

const explorePosts = async (req, res) => {
  try {
    const users = await userModel.find(
      { post: { $exists: true, $ne: [] } },
      { username: 1, img: 1, post: 1 },
    );

    let allPosts = [];

    users.forEach((user) => {
      user.post.forEach((p) => {
        allPosts.push({
          image: p.image,
          caption: p.caption,
          createdAt: p.createdAt,
          username: user.username,
          userImg: user.img,
        });
      });
    });

    // newest first
    allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(allPosts);
  } catch (error) {
    console.error("Explore error:", error);
    res.status(500).json({ success: false });
  }
};

export {
  sendotp,
  verifyotp,
  signup,
  login,
  resetpassword,
  addSampleNotifications,
  deleteNotification,
  confirmNotification,
  googlelogin,
  completeProfile,
  deleteotp,
  userdetails,
  upload,
  posting,
  explorePosts,
};
