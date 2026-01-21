import jwt from "jsonwebtoken";
import dotenv from "dotenv"
import userModel from "../models/users.js";
import ActivityLog from "../models/ActivityLog.js";

dotenv.config()

const adminemail="admin@gmail.com"
const adminpassword="admin123"


const adminlogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email !== adminemail || password !== adminpassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    // 🔹 Save admin login activity using .save()
    const log = new ActivityLog({
      userName: "Admin",
      email: email,
      role: "Admin",
      action: "LOGIN",
      description: "Admin logged in",
      ip: req.ip,
      device: req.headers["user-agent"],
      time:new Date
    });

    await log.save(); // ✅ Save to DB

    // 🔹 Generate token
    const token = jwt.sign(
      { role: "admin", email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      token,
      role: "admin",
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ success: false });
  }
};

export default adminlogin;




const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find().select("-password");

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};


// 🔹 Block / Unblock user
 const toggleBlockUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User status updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};


// GET ALL MESSAGES
export const getAllMessages = async (req, res) => {
  try {
    const messages = await userModel.find().sort({ createdAt: -1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// GET ADMINS ONLY
export const getAdmins = async (req, res) => {
  try {
    const admins = await userModel.find({ role: "admin" }).select("-password");
    res.json({ success: true, admins });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};


 const saveLoginLog = async (req, user) => {
  try {
    await LoginLog.create({
      userName: user.name || "Admin",
      email: user.email,
      role: user.role,
      ip: req.ip,
      device: req.headers["user-agent"],
    });
  } catch (error) {
    console.error("Login log error:", error);
  }
};


export const getLoginLogs = async (req, res) => {
  try {
    // Fetch all activity logs sorted by time (latest first)
    const logs = await ActivityLog.find()
      .select("userName email role ip device action description time")
      .sort({ time: -1 });

    res.status(200).json(
      logs.map(log => ({
        _id: log._id,
        userName: log.userName,
        email: log.email,
        role: log.role,
        ip: log.ip,
        device: log.device,
        action: log.action,
        description: log.description,
        time: log.time,
      }))
    );
  } catch (error) {
    console.error("Login logs error:", error);
    res.status(500).json({ message: "Failed to fetch login logs" });
  }
};



export const getReports = async (req, res) => {
  const reports = await Report.find({ status: "pending" });
  res.json(reports);
};

export const blockUser = async (req, res) => {
  const report = await Report.findById(req.params.id);

  await User.findByIdAndUpdate(
    report.reportedUser.userId,
    { isBlocked: true }
  );

  report.status = "blocked";
  await report.save();

  res.json({ success: true });
};

export const dismissReport = async (req, res) => {
  await Report.findByIdAndUpdate(req.params.id, {
    status: "dismissed",
  });
  res.json({ success: true });
};







export{
    adminlogin,
    toggleBlockUser,
    getAllUsers,
    saveLoginLog,
}