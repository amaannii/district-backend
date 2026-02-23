import nodemailer from "nodemailer";
import dotenv from "dotenv";
import userModel from "../models/users.js";
import bcrypt from "bcrypt";
import otpModel from "../models/otp.js";
import jwt from "jsonwebtoken";
import ActivityLog from "../models/ActivityLog.js";
import mongoose from "mongoose";


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
    console.log(email, password);

    const user = await userModel.findOne({ email });
    console.log(user);

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
      user = new userModel({
        name,
        email,
        role: "user", // default role
      });

      await user.save();
    }

    // 🔐 CREATE TOKEN
    const token = jwt.sign(
      {
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
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

const allusers = async (req, res) => {
  try {
    const users = await userModel.find({}, { password: 0, email: 0 });

    if (users.length > 0) {
      res.json({
        success: true,
        users: users,
      });
    } else {
      res.json({
        success: false,
        message: "No users found",
      });
    }
  } catch (error) {
    res.status(500).json({
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

    console.log(username);
    console.log(email);

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

    const users = await userModel.find(
      { "post.0": { $exists: true } },
      { username: 1, img: 1, post: 1 }
    );

    let feedPosts = [];

    users.forEach((u) => {
      u.post.forEach((p) => {
        feedPosts.push({
          _id: p._id,
          image: p.image,
          caption: p.caption,
          createdAt: p.createdAt,
          likes: p.likes || 0,
          comments: p.comments || [],
          isLiked: p.likedBy?.some(
            (id) => id.toString() === currentUserId
          ),
          userId: {
            _id: u._id,
            username: u.username,
            img: u.img,
          },
        });
      });
    });

    feedPosts.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({ success: true, posts: feedPosts });
  } catch (err) {
    res.status(500).json({ success: false });
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
    if (!postOwner) return res.status(404).json({ success: false, message: "Post not found" });

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
    if (!text.trim()) return res.status(400).json({ success: false, message: "Comment empty" });

    const postOwner = await userModel.findOne({ "post._id": postId });
    if (!postOwner) return res.status(404).json({ success: false, message: "Post not found" });

    const post = postOwner.post.id(postId);

    const currentUser = await userModel.findById(userId).select("username img");

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

    res.json({ success: true, comment: newComment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
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

    const result = await userModel.updateOne(
      { email: email },
      { $set: { img: "" } },
    );

    if (result.modifiedCount > 0) {
      return res.status(200).json({
        success: true,
        message: "Image deleted successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No image found or already deleted",
      });
    }
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

    // Find user who owns the post
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find post inside user's post array
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

const sendPostToChats = async (req, res) => {
  try {
    const { chatIds, postId } = req.body;
    const senderId = req.user.id;

    for (let chatId of chatIds) {
      await Messages.create({
        chatId,
        senderId,
        type: "post",
        content: postId,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

const updateGender = async (req, res) => {
  try {
    const { gender } = req.body;
    const email = req.user.email;

    console.log("Gender:", gender);
    console.log("User Email:", email);

    const users = await userModel.updateOne(
      { email: email },
      { $set: { gender: gender } },
      { upsert: true },
    );

  

    if (users) {
      res.status(200).json({
        success: true,
        message: "Gender updated successfully ✅",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Problem while updating gender ❌",
      });
    }
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

    const user = await userModel.updateOne({ email }, { $set: { bio } });

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

    await userModel.updateOne(
      { email },
      {
        $set: {
          "notifications.enabled": enabled,
          "notifications.duration": duration,
        },
      },
    );

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

    // const savedOtp = await otpModel.findOne({ email });

    // if (!savedOtp) {
    //   return res.status(400).json({ message: "OTP expired or invalid" });
    // }

    // if (savedOtp.otp.toString() !== otp) {
    //   return res.status(400).json({ message: "Incorrect OTP" });
    // }

    // if (savedOtp.expiresAt < Date.now()) {
    //   return res.status(400).json({ message: "OTP expired" });
    // }

    const user = await userModel.findOne({ email });

    const isMatch =  bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({ message: "Current password incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    // Delete OTP after success
    await otpModel.deleteMany({ email });

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

    // ✅ Get logged in user id
    const userId = req.user.id;

    await userModel.findByIdAndUpdate(
      userId,
      { commentsPermission: permission },
      { new: true },
    );

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
    const userId = req.user.id; // from token middleware
    const { number } = req.body;

    if (!number) {
      return res.status(400).json({ message: "Number is required" });
    }

    // ✅ Must be exactly 10 digits
    if (!/^[0-9]{10}$/.test(number)) {
      return res.status(400).json({
        message: "Contact number must be exactly 10 digits",
      });
    }

    const user = await userModel.findById(userId);

    // ✅ Max 10 contacts allowed

    // ✅ Prevent duplicate numbers

    // ✅ Save number
    user.contacts=number;
    await user.save();

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
    console.log(email);
    

    const user = await userModel.findOne({email});
    console.log(user);
    

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

    res.json({ contacts: user.contacts });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateContact = async (req, res) => {
  try {
    const email = req.user.email;
    const { newNumber } = req.body;

    const user = await userModel.updateOne(
      { email: email }, // find user by email
      { $set: { contacts: newNumber } } // update contact field
    );

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

    const user = await userModel.findOneAndUpdate(
      { email },
      {
        birthday: { month, day, year },
      },
      { new: true }
    );

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


const testNotification =async (req, res) => {
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
}


const updateName = async (req, res) => {
  const email = req.user.email;
  const { name } = req.body;

  await userModel.updateOne({ email }, { $set: { name } });

  res.json({ success: true });
};



// const getMyPosts = async (req, res) => {
//   try {
//     const userId = req.user.id;

// POST /user/save-post
// POST /user/save-post
const savePost = async (req, res) => {
  const { postId,username } = req.body;
  const user = await userModel.findOne({email:req.user.email});
  console.log(postId,username);
  

  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  // const alreadySaved = user.savedPosts.some(
  //   (p) => p.postId.toString() === postId
  // );

  // if (alreadySaved) {
  //   user.savedPosts = user.savedPosts.filter((p) => p.postId.toString() !== postId);
  // } else {
    if(user.savedPosts){
      await userModel.updateOne({email:req.user.email},{$push:{savedPosts:{ postId, savedAt: new Date(),username:username }}});
    }else{
     const user1= await userModel.updateOne({email:req.user.email},{$set:{savedPosts:[{ postId, savedAt: new Date(),username:username }]}});
      console.log(user1);
      
    }


  res.json({ success: true, saved: "saved successfully" }); // returns new status
};

const getSavedPosts = async (req, res) => {
  try {
    const currentUser = await userModel.findOne({ email: req.user.email });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    let allSavedPosts = [];

    for (let saved of currentUser.savedPosts) {

      // Find the user who owns this post
      const postOwner = await userModel.findOne({
        username: saved.username,
        "post._id": saved.postId
      });

      if (!postOwner) continue;

      // Find the specific post inside their post array
      const postData = postOwner.post.id(saved.postId);

      if (!postData) continue;

      // Push combined data
      allSavedPosts.push({
        ...postData._doc,
        postOwner: {
          username: postOwner.username,
          name: postOwner.name,
          avatar: postOwner.avatar
        },
        savedAt: saved.savedAt
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
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.savedPosts = user.savedPosts.filter(
      post => post.postId.toString() !== req.params.postId
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

    // Find the user who owns the post
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

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // ✅ Only comment owner can delete
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this comment",
      });
    }

    comment.deleteOne();
    await postOwner.save();

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
  getProfile,
  unsavePost,
  deleteComment,
  savePost,
  getSavedPosts,
 



};
