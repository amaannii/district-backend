import nodemailer from "nodemailer";
import dotenv from "dotenv";
import userModel from "../models/users.js";
import bcrypt from "bcrypt";
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

  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  console.log("OTP for", email, otp, otpStore[email]);

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
  let { email, otp } = req.body;

  email = email.trim().toLowerCase();

  console.log("Frontend OTP:", otp);
  console.log("Stored OTP:", otpStore[email].otp);

  if (!otpStore[email].otp) {
    return res.status(400).json({ message: "OTP expired or not found" });
  }

  if (otpStore[email].otp.toString() === otp.toString()) {
    delete otpStore[email];
    return res.json({ message: "OTP verified successfully", status: true });
  }

  return res.status(400).json({ message: "Invalid OTP" });
};

const signup = (req, res) => {
  console.log(req.body);
  const { email, password, username, name } = req.body;
  const users = new userModel({
    email: email,
    password: password,
    username: username,
    name: name,
  });
  users
    .save()
    .then(() => {
      res.json({ success: true });
    })

    .catch((err) => {
      console.log(err);
    });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Find user by email only
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 2️⃣ Compare entered password with hashed password
    const isMatch = bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 3️⃣ Login success
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const resetpassword = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);

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
      { new: true }
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

    if (!user) {
      const users = new userModel({
        email: email,
        name: name,
      });
      users
        .save()
        .then(() => {
          res.status(200).json({
            success: true,
            user,
          });
        })
        .catch((error) => {
          res.status(500).json({
            success: false,
            message: "Google login failed",
          });
        });
    } else {
      if (email == useremail && name == username) {
       res.json({success:true})
      } else {
       res.json({success:false})
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Google login failed",
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
};
