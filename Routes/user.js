import express from "express";
import {
  addSampleNotifications,
  completeProfile,
  confirmNotification,
  deleteNotification,
  deleteotp,
  googlelogin,
  login,
  resetpassword,
  sendotp,
  signup,
  verifyotp,
 
}
 from "../controller/usercontroller.js";



const userrouter = express();

userrouter.post("/send-otp", sendotp);
userrouter.post("/verify-otp", verifyotp);
userrouter.post("/signup", signup);
userrouter.post("/login", login);
userrouter.post("/reset-password", resetpassword);
userrouter.post("/sample", addSampleNotifications);
userrouter.delete("/delete/:id", deleteNotification);
userrouter.post("/confirm/:id", confirmNotification);
userrouter.post("/google-login",googlelogin);
userrouter.post("/complete-profile",completeProfile);
userrouter.post("/delete-otp",deleteotp);

export default userrouter;
