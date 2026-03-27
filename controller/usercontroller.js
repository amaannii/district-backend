import nodemailer from "nodemailer";
import dotenv from "dotenv";
import userModel from "../models/users.js";
import bcrypt from "bcrypt";
import otpModel from "../models/otp.js";
import jwt from "jsonwebtoken";
import ActivityLog from "../models/ActivityLog.js";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import { Resend } from "resend";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

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
  await resend.emails.send({
    from: "onboarding@resend.dev",
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
    if (otps.otp == otp) {
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
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        img: user.img,
      },
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

    let user = await userModel.findOne({ email });

    // 🟢 USER DOES NOT EXIST → CREATE
    if (!user) {
      user =  new userModel({
        name,
        email,
        role: "user", // default role
      });

      await user.save();
    }

    // 🔐 CREATE TOKEN
    const token = jwt.sign(
      {
        id:user._id,
        email: user.email,
        role: "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      success: true,
      token,
      email: user.email,
      role: user.role,
      message: "Google login successful",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Google login failed",
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

  const user = await userModel.findOne({ email: req.user.email });

  res.json({
    message: "User details fetched",
    user: user,
  });
};

const upload = async (req, res) => {
  const { img } = req.body;
  const { email, role } = req.user;

  const users = await userModel.updateOne(
    { email: email },
    { $set: { img: img } },
    { upsert: true },
  );

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
          _id: p._id,
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

const allusers = async (req, res) => {
  const { email } = req.user;

  try {
    const users = await userModel.find(
      { email: { $ne: email } },
      {
        password: 0,
        email: 0,
      },
    );

    const formattedUsers = users.map((user) => ({
      ...user._doc,
      bio: user.bio,
      connectedCount: user.connected ? user.connected.length : 0,
      connectingCount: user.connecting ? user.connecting.length : 0,
    }));

    if (formattedUsers.length > 0) {
      return res.json({
        success: true,
        users: formattedUsers,
      });
    } else {
      return res.json({
        success: false,
        message: "No users found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const checkconnecting = async (req, res) => {
  try {
    const { username } = req.body;
    const email = req.user.email;

    // 1️⃣ Find logged-in user
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2️⃣ Check if username exists in connecting array
    const isConnecting = user.connecting.some((u) => u.username === username);

    const isRequested = user.connecting.some((u) => u.username === username);

    return res.json({
      success: true,
      isConnected,
      isRequested,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const request = async (req, res) => {
  try {
    const { username } = req.body;
    const email = req.user.email;

    // 🔹 sender
    const sender = await userModel.findOne(
      { email },
      { _id: 1, username: 1, name: 1, img: 1 },
    );

    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    // 🔹 receiver
    const receiver = await userModel.findOne({ username });

    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔹 request object with date
    const requestData = {
      username: sender.username,
      name: sender.name,
      img: sender.img,
      Date: new Date(), // ✅ DATE ADDED
    };

    // 🔹 prevent duplicates
    await userModel.updateOne(
      { username },
      { $addToSet: { request: requestData } },
    );

    res.json({
      success: true,
      message: "Request sent successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const notifications = async (req, res) => {
  try {
    const email = req.user.email;

    const user = await userModel.findOne({ email }, { request: 1 });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      request: user.request || [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const confirmnotification = async (req, res) => {
  try {
    const { username } = req.body;
    const email = req.user.email;

    // get request array
    const data = await userModel.findOne({ email }, { request: 1, _id: 0 });

    let connecting = await userModel.findOne(
      { email: email },
      { _id: 0, username: 1, img: 1, name: 1 },
    );
    connecting.Date = new Date();

    if (!data || !data.request) {
      return res.json({ success: false, message: "No requests found" });
    }

    // find matching user
    const connected = data.request.find((u) => u.username === username);

    if (!connected) {
      return res.json({
        success: false,
        message: "User not found in requests",
      });
    }

    // add to both users
    await userModel.updateOne(
      { username },
      { $push: { connecting: connecting } },
    );

    await userModel.updateOne({ email }, { $push: { connected: connected } });

    // remove from request array
    await userModel.updateOne({ email }, { $pull: { request: { username } } });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

const notificationdelete = async (req, res) => {
  const { id } = req.body;
  const email = req.user.email;

  const users = await userModel.updateOne(
    { email: email },
    {
      $pull: {
        request: { _id: id },
      },
    },
  );

  if (users) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
};

const getFeedPosts = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    

    const currentUser = await userModel.findById(currentUserId);

    const users = await userModel.find(
      { "post.0": { $exists: true } },
      { username: 1, img: 1, post: 1 },
    );

    let feedPosts = [];

    users.forEach((u) => {
      u.post.forEach((p) => {
        const isLiked = p.likedBy?.some(
          (id) => id.toString() === currentUserId,
        );

        const isSaved = currentUser.savedPosts?.some(
          (saved) => saved.postId.toString() === p._id.toString(),
        );

        feedPosts.push({
          _id: p._id,
          image: p.image,
          caption: p.caption,
          createdAt: p.createdAt,
          likes: p.likes || 0,
          comments: p.comments || [],
          isLiked: !!isLiked,
          isSaved: !!isSaved,
          userId: {
            _id: u._id,
            username: u.username,
            img: u.img,
          },
        });
      });
    });

    feedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, posts: feedPosts });
  } catch (err) {
    res.status(500).json({ success: false,err });
  }
};

const getimage = async (req, res) => {
  try {
    const email = req.user.email;

    // Find logged-in user
    const user = await userModel.findOne({ email: email }, { img: 1, _id: 0 });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      image: user.img,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- LIKE / UNLIKE POST ---------------- */
// ✅ LIKE POST
// LIKE / UNLIKE POST
const likePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.body;

    const postOwner = await userModel.findOne({ "post._id": postId });
    if (!postOwner)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const post = postOwner.post.id(postId);
    post.likedBy = post.likedBy || [];
    post.likes = post.likes || 0;

    const liked = post.likedBy.some((id) => id.toString() === userId);
    if (liked) {
      post.likedBy = post.likedBy.filter((id) => id.toString() !== userId);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      post.likedBy.push(userId);
      post.likes += 1;
    }

    await postOwner.save();

    res.json({ success: true, likes: post.likes, isLiked: !liked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId, text } = req.body;

    if (!text.trim())
      return res.status(400).json({ success: false, message: "Comment empty" });

    const postOwner = await userModel.findOne({ "post._id": postId });

    if (!postOwner)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const post = postOwner.post.id(postId);

    const currentUser = await userModel
      .findById(userId)
      .select("username img email name");

    const newComment = {
      userId: currentUser._id,
      username: currentUser.username,
      img: currentUser.img,
      text: text.trim(),
      createdAt: new Date(),
    };

    post.comments = post.comments || [];
    post.comments.push(newComment);

    await postOwner.save();

    await Message.updateOne(
      { post: postId },
      {
        $push: {
          "post.comments": newComment,
        },
      },
    );

    // ✅ Activity Log
    await ActivityLog.create({
      userId: currentUser._id,
      userName: currentUser.name || currentUser.username,
      email: currentUser.email,
      role: "User",
      action: "ADD_COMMENT",
      log: "User added a comment",
      ip: req.ip,
      device: req.headers["user-agent"],
      time: new Date(),
    });

    res.json({
      success: true,
      comment: newComment,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


const notes = async (req, res) => {
  try {
    const email = req.user.email;

    // Current user
    const me = await userModel.findOne({ email });

    // Get connected usernames
    const connectedUsernames = me.connected.map((c) => c.username);

    // Fetch connected users who have notes
    const connectedNotes = await userModel
      .find({
        username: { $in: connectedUsernames },
        note: { $ne: "" }, // only users who wrote a note
      })
      .select("username img note noteCreatedAt");

    res.json({
      success: true,

      // My note
      myNote: {
        username: me.username,
        img: me.img,
        note: me.note,
      },
      user: me.username,

      // Connected users notes
      connectedNotes,
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

const note = async (req, res) => {
  try {
    const { note } = req.body;
    const email = req.user.email;

    await userModel.updateOne(
      { email },
      {
        $set: {
          note: note,
          noteCreatedAt: new Date(),
        },
      },
    );

    res.json({ success: true, message: "Note updated" });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

const deletedimg = async (req, res) => {
  try {
    const email = req.user.email;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.img = "";
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      role: "User",
      action: "DELETE_PROFILE_IMAGE",
      log: "User deleted profile image",
      ip: req.ip,
      device: req.headers["user-agent"],
      time: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { caption } = req.body;
    const email = req.user.email;

    // Find user
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find post
    const post = user.post.id(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Update caption
    post.caption = caption;

    await user.save();

    // ✅ Log activity AFTER success
    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      role: "User",
      action: "UPDATE_POST",
      log: "User updated a post",
      ip: req.ip,
      device: req.headers["user-agent"],
      time: new Date(),
    });

    res.json({
      success: true,
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const email = req.user.email;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const post = user.post.id(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Remove post
    post.deleteOne();

    await user.save();

    // 🔹 SAVE ACTIVITY LOG
    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      role: "User",
      action: "DELETE",
      log: "User deleted a post",
      ip: req.ip,
      device: req.headers["user-agent"],
      time: new Date(),
    });

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateGender = async (req, res) => {
  try {
    const { gender } = req.body;
    const email = req.user.email;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.gender = gender;
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      role: "User",
      action: "UPDATE_GENDER",
      log: "User updated gender",
      ip: req.ip,
      device: req.headers["user-agent"],
      time: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Gender updated successfully ✅",
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error ❌",
    });
  }
};

const updateBio = async (req, res) => {
  try {
    const { bio } = req.body;
    const email = req.user.email;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // update bio
    user.bio = bio;
    await user.save();

    // log activity
    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      role: "User",
      action: "UPDATE_BIO",
      log: "User updated bio",
      ip: req.ip,
      device: req.headers["user-agent"],
      time: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Bio updated successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating bio",
    });
  }
};

const updateNotifications = async (req, res) => {
  try {
    const { enabled, duration } = req.body;
    const email = req.user.email;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.notifications.enabled = enabled;
    user.notifications.duration = duration;

    await user.save();

    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      role: "User",
      action: "UPDATE_NOTIFICATION",
      log: "User updated notification settings",
      ip: req.ip,
      device: req.headers["user-agent"],
      time: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Notification settings updated ✅",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating notifications ❌",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, otp } = req.body;
    const email = req.user.email;

    if (!otp) {
      return res.status(400).json({ message: "OTP required" });
    }

    const user = await userModel.findOne({ email });

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    await otpModel.deleteMany({ email });

    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      role: "User",
      action: "CHANGE_PASSWORD",
      log: "User changed password",
      ip: req.ip,
      device: req.headers["user-agent"],
      time: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const updateCommentPermission = async (req, res) => {
  try {
    const { permission } = req.body;

    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.commentsPermission = permission;
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      role: "User",
      action: "UPDATE_COMMENT_PERMISSION",
      log: "User updated comment permission",
      ip: req.ip,
      device: req.headers["user-agent"],
      time: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Comment permission updated ✅",
    });

  } catch (err) {
    console.log("Update Error:", err);
    res.status(500).json({ success: false });
  }
};

const getUserSettings = async (req, res) => {
  try {
    // ✅ Logged in user id
    const userId = req.user.id;

    const user = await userModel.findById(userId).select("commentsPermission");

    res.status(200).json({
      success: true,
      commentsPermission: user.commentsPermission,
    });
  } catch (err) {
    console.log("Fetch Error:", err);
    res.status(500).json({ success: false });
  }
};

const addContactNumber = async (req, res) => {
  try {
    const userId = req.user.id;
    const { number } = req.body;

    if (!number) {
      return res.status(400).json({ message: "Number is required" });
    }

    if (!/^[0-9]{10}$/.test(number)) {
      return res.status(400).json({
        message: "Contact number must be exactly 10 digits",
      });
    }

    const user = await userModel.findById(userId);

    user.contacts = number;
    await user.save();

    // ✅ Activity log
    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      role: "User",
      action: "ADD_CONTACT",
      log: "User added contact number",
      ip: req.ip,
      device: req.headers["user-agent"],
      time: new Date(),
    });

    res.json({
      message: "Contact number added successfully",
      contacts: user.contacts,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getContacts = async (req, res) => {
  try {
    const email = req.user.email;

    const user = await userModel.findOne({ email });

    res.json({
      contacts: user.contacts,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteContact = async (req, res) => {
  try {
    const { number } = req.body;

    const user = await userModel.findById(req.user.id);

    user.contacts = user.contacts.filter((n) => n !== number);
    await user.save();

    // ✅ Activity log
    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      role: "User",
      action: "DELETE_CONTACT",
      log: "User deleted contact number",
      ip: req.ip,
      device: req.headers["user-agent"],
      time: new Date(),
    });

    res.json({ contacts: user.contacts });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateContact = async (req, res) => {
  try {
    const email = req.user.email;
    const { newNumber } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.contacts = newNumber;
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      role: "User",
      action: "UPDATE_CONTACT",
      log: "User updated contact number",
      ip: req.ip,
      device: req.headers["user-agent"],
      time: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Contact number updated successfully ✅",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong ❌",
    });
  }
};

const updateBirthday = async (req, res) => {
  try {
    const email = req.user.email;
    const { month, day, year } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.birthday = { month, day, year };
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      role: "User",
      action: "UPDATE_BIRTHDAY",
      log: "User updated birthday",
      ip: req.ip,
      device: req.headers["user-agent"],
      time: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Birthday updated successfully ✅",
      birthday: user.birthday,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Error updating birthday ❌",
    });
  }
};

const testNotification = async (req, res) => {
  const { token } = req.body;

  await admin.messaging().send({
    token,
    notification: {
      title: "Hello Amani 🔥",
      body: "Notification working now!",
    },
    webpush: {
      fcmOptions: {
        link: "http://localhost:5173",
      },
    },
  });

  res.json({ success: true });
};

const updateName = async (req, res) => {
  try {
    const email = req.user.email;
    const { name } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.name = name;
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      role: "User",
      action: "UPDATE_NAME",
      log: "User updated name",
      ip: req.ip,
      device: req.headers["user-agent"],
      time: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};;

const savePost = async (req, res) => {
  try {
    const { postId, username } = req.body;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: "postId is required",
      });
    }

    const user = await userModel.findOne({ email: req.user.email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.savedPosts) {
      user.savedPosts = [];
    }

    const alreadySaved = user.savedPosts.some(
      (p) => p.postId.toString() === postId,
    );

    if (alreadySaved) {
      user.savedPosts = user.savedPosts.filter(
        (p) => p.postId.toString() !== postId,
      );

      await user.save();

      return res.json({
        success: true,
        isSaved: false,
        message: "Post removed from saved",
      });
    }

    user.savedPosts.push({
      postId,
      username,
      savedAt: new Date(),
    });

    await user.save();

    return res.json({
      success: true,
      isSaved: true,
      message: "Post saved successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSavedPosts = async (req, res) => {
  try {
    const currentUser = await userModel.findOne({ email: req.user.email });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    let allSavedPosts = [];

    for (const saved of currentUser.savedPosts) {
      let postOwner;

      // If the saved post belongs to current user
      if (saved.username === currentUser.username) {
        postOwner = currentUser;
      } else {
        postOwner = await userModel.findOne({ username: saved.username });
      }

      if (!postOwner) continue;

      const postData = postOwner.post.find(
        (p) => p._id.toString() === saved.postId.toString(),
      );

      if (!postData) continue;

      allSavedPosts.push({
        ...postData._doc,
        postOwner: {
          username: postOwner.username,
          name: postOwner.name,
          avatar: postOwner.avatar,
        },
        savedAt: saved.savedAt,
      });
    }

    res.status(200).json(allSavedPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// GET /api/profile/:userId
const getProfile = async (req, res) => {
  try {
    const profileUser = await userModel.findById(req.params.userId);

    if (!profileUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Always send posts
    const posts = profileUser.post;

    let savedPosts = [];

    // ✅ Only owner can see saved posts
    if (req.user.id === req.params.userId) {
      savedPosts = profileUser.savedPosts;
    }

    res.json({
      profileUser,
      posts,
      savedPosts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unsavePost = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.savedPosts = user.savedPosts.filter(
      (post) => post.postId.toString() !== req.params.postId,
    );

    await user.save();

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.body;
    const userId = req.user.id;

    const postOwner = await userModel.findOne({ "post._id": postId });

    if (!postOwner) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const post = postOwner.post.id(postId);
    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this comment",
      });
    }

    comment.deleteOne();
    await postOwner.save();

    const user = await userModel.findById(userId);

    // ✅ Activity log
    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      role: "User",
      action: "DELETE_COMMENT",
      log: "User deleted a comment",
      ip: req.ip,
      device: req.headers["user-agent"],
      time: new Date(),
    });

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });

  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const sendPostToChats = async (req, res) => {
  try {
    const { chatIds, postId } = req.body;
    const senderId = req.user.id;

    if (!chatIds?.length || !postId) {
      return res.status(400).json({
        success: false,
        message: "Missing data",
      });
    }

    // Get sender
    const sender = await userModel.findById(senderId).select("username");

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Sender not found",
      });
    }

    // 🔥 Find post inside users
    const postOwner = await userModel.findOne({
      "post._id": postId,
    });

    if (!postOwner) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const post = postOwner.post.id(postId);

    // Create one message per district
    for (let district of chatIds) {
      await Message.create({
        district,
        sender: sender.username,
        type: "post",
        post: post._id,
        postOwner: postOwner._id, // VERY IMPORTANT
      });
    }

    res.json({
      success: true,
      message: "Post shared successfully ✅",
    });
  } catch (err) {
    console.error("Share error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getDistrictMessages = async (req, res) => {
  try {
    const { district } = req.params;

    const messages = await Message.find({ district }).sort({ createdAt: 1 });

    const updatedMessages = await Promise.all(
      messages.map(async (msg) => {
        if (msg.post) {
          const postOwner = await userModel.findOne({
            "post._id": msg.post,
          });

          if (postOwner) {
            const fullPost = postOwner.post.id(msg.post);

            return {
              ...msg._doc,
              post: {
                _id: fullPost._id,
                image: fullPost.image, // ✅ IMAGE LINK
                caption: fullPost.caption,
                comments: fullPost.comments,
                likes: fullPost.likes,
              },
              postOwner: {
                _id: postOwner._id,
                username: postOwner.username,
                avatar: postOwner.img,
              },
            };
          }
        }

        return msg;
      }),
    );

    res.json({ success: true, messages: updatedMessages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

const unconnect = async (req, res) => {
  try {
    const { username } = req.body;
    const email = req.user.email;

    const currentUser = await userModel.findOne({ email });
    const targetUser = await userModel.findOne({ username });

    if (!targetUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Remove each other from connected and connecting arrays
    currentUser.connected = currentUser.connected.filter(
      (c) => c.username !== username,
    );
    currentUser.connecting = currentUser.connecting.filter(
      (c) => c.username !== username,
    );

    targetUser.connected = targetUser.connected.filter(
      (c) => c.username !== currentUser.username,
    );
    targetUser.connecting = targetUser.connecting.filter(
      (c) => c.username !== currentUser.username,
    );

    await currentUser.save();
    await targetUser.save();

    res.json({ success: true, message: `Disconnected from ${username}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const connectionStatus = async (req, res) => {
  try {
    const email = req.user.email;
    const username = req.params.username?.trim().toLowerCase();

    const currentUser = await userModel.findOne({ email });
    
    const user = await userModel.findOne({ username });

    if (!currentUser) {
      return res.json({ status: "none" });
    }

    // CHECK CONNECTED
    const isConnected = currentUser.connecting?.some(
      (user) => user.username?.toLowerCase() === username
    );

    if (isConnected) {
      return res.json({ status: "connected" });
    }

    // CHECK CONNECTING
    const isRequested = user.request?.some(
      (user) => user.username?.toLowerCase() === currentUser.username
    );

    if (isRequested) {
      return res.json({ status: "requested" });
    }

    return res.json({ status: "none" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "none" });
  }
};

const getConnections = async (req, res) => {
  try {
    const email = req.user.email;
    const type = req.params.type;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let list = [];

    if (type === "connected") list = user.connected || [];
    else if (type === "connecting") list = user.connecting || [];
    else
      return res.status(400).json({ success: false, message: "Invalid type" });

    res.json({ success: true, type, users: list });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const removeConnection = async (req, res) => {
  try {
    const email = req.user.email;
    const { username } = req.body;

    const currentUser = await userModel.findOne({ email });
    const targetUser = await userModel.findOne({ username });

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Remove from current user
    currentUser.connected = currentUser.connected.filter(
      (u) => u.username !== username,
    );

    currentUser.connecting = currentUser.connecting.filter(
      (u) => u.username !== username,
    );

    // ✅ Remove from target user also
    targetUser.connected = targetUser.connected.filter(
      (u) => u.username !== currentUser.username,
    );

    targetUser.connecting = targetUser.connecting.filter(
      (u) => u.username !== currentUser.username,
    );

    await currentUser.save();
    await targetUser.save();

    res.json({
      success: true,
      message: "Connection removed successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const deleteNote = async (req, res) => {
  try {
    const email = req.user.email;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.note = "";
    user.noteCreatedAt = null;
    await user.save();

    // ✅ Activity log
    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      role: "User",
      action: "DELETE_NOTE",
      log: "User deleted note",
      ip: req.ip,
      device: req.headers["user-agent"],
      time: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


const seleccteduser = async (req, res) => {
  try {
    // Correctly get username from query parameters
    const { username } = req.body; // not req.query.username

    console.log("Requested username:", username);

    if (!username) {
      return res
        .status(400)
        .json({ success: false, message: "Username is required" });
    }

    // Assuming userModel is your Mongoose model
    const user = await userModel.findOne({ username: username });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSinglePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const currentUserId = req.user.id;

    // 🔎 Find user who owns this post
    const postOwner = await userModel.findOne({
      "post._id": postId,
    });

    if (!postOwner) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const post = postOwner.post.id(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // ✅ Check if liked
    const isLiked = post.likedBy?.some((id) => id.toString() === currentUserId);

    // ✅ Check if saved
    const currentUser = await userModel.findById(currentUserId);
    const isSaved = currentUser.savedPosts?.some(
      (p) => p.postId.toString() === postId,
    );

    res.json({
      success: true,
      post: {
        _id: post._id,
        image: post.image,
        caption: post.caption,
        createdAt: post.createdAt,
        likes: post.likes || 0,
        comments: post.comments || [],
        isLiked: !!isLiked,
        isSaved: !!isSaved,
        userId: {
          _id: postOwner._id,
          username: postOwner.username,
          img: postOwner.img,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const checkisliked = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.body;

    const postOwner = await userModel.findOne({ "post._id": postId });

    if (!postOwner) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const post = postOwner.post.id(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // 🔥 Check if userId exists inside likedBy array
    const isLiked = (post.likedBy || []).some(
      (id) => id.toString() === userId.toString(),
    );

    res.json({
      success: true,
      isLiked, // true or false
      likes: post.likes || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    const user = req.user;
    console.log(user);

    const log = new ActivityLog({
      userId: user._id,
      userName: "User",
      email: user.email,
      role: "User",
      action: "LOGOUT",
      log: "User Logged Out",
      ip: req.ip,
      device: req.headers["user-agent"],
      time: new Date(),
    });

    await log.save();

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout error" });
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
  allusers,
  request,
  notifications,
  notificationdelete,
  confirmnotification,
  getFeedPosts,
  getimage,
  addComment,
  likePost,
  notes,
  note,
  updatePost,
  deletePost,
  deletedimg,
  sendPostToChats,
  updateGender,
  updateBio,
  updateNotifications,
  changePassword,
  updateCommentPermission,
  getUserSettings,
  addContactNumber,
  getContacts,
  deleteContact,
  updateContact,
  updateBirthday,
  testNotification,
  updateName,
  savePost,
  getProfile,
  unsavePost,
  deleteComment,
  getSavedPosts,
  connectionStatus,
  unconnect,
  getConnections,
  getDistrictMessages,
  checkconnecting,
  removeConnection,
  deleteNote,
  seleccteduser,
  getSinglePost,
  checkisliked,
  logoutUser,
};
