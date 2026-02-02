import express from "express";

import {

  addSampleNotifications,
  allusers,
  completeProfile,
  confirmNotification,
  deleteNotification,
  deleteotp,
  explorePosts,
  googlelogin,
  login,
  notificationdelete,
  notifications,
  posting,
  request,
  resetpassword,
  sendotp,
  signup,
  upload,
  userdetails,
  verifyotp,
 
}
 from "../controller/usercontroller.js";
import authMiddleware from "../middleware/authMiddleware.js";



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
userrouter.post("/userdetails",authMiddleware,userdetails);
userrouter.post("/upload",authMiddleware,upload);
userrouter.post("/posting",authMiddleware,posting);
userrouter.get("/posts/explore", explorePosts); 
userrouter.get("/allusers", allusers); 
userrouter.post("/request",authMiddleware,request);
userrouter.get("/notifications",authMiddleware,notifications);
userrouter.post("/notificationdelete",authMiddleware,notificationdelete);

export default userrouter;
 