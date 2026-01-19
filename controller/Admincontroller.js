import jwt from "jsonwebtoken";
import dotenv from "dotenv"
import userModel from "../models/users.js";

dotenv.config()

const adminemail="admin@gmail.com"
const adminpassword="admin123"


const adminlogin=(req,res)=>{
const {email,password}=req.body
if(email===adminemail&&password===adminpassword){
    const token = jwt.sign(
      {
        role: "admin",
        email: adminemail,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
    return res.status(200).json({
      success: true,
      token,
      role:"admin" // 👈 send token to frontend
    });
}else{
     return res.status(401).json({
    success: false,
    message: "Invalid admin credentials",
  });
}
}


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

export{
    adminlogin,
    toggleBlockUser,
    getAllUsers,
}