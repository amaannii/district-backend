import express from "express";

import {
  addComment,
  addContactNumber,
  addSampleNotifications,
  allusers,
  changePassword,
  checkconnecting,
  // cancelRequest,
  completeProfile,
  confirmnotification,
  confirmNotification,
  connectionStatus,
  deleteComment,
  deleteContact,
  // connectionStatus,
  deletedimg,
  deleteNotification,
  deleteotp,
  deletePost,
  explorePosts,
  getConnections,
  getContacts,
  getDistrictMessages,
  getFeedPosts,
  getimage,
  getProfile,
  getSavedPosts,
  getUserSettings,
  googlelogin,
  likePost,
  login,
  note,
  notes,
  notificationdelete,
  notifications,
  posting,
  removeConnection,
  request,
  resetpassword,
  savePost,
  sendotp,
  sendPostToChats,
  signup,
  testNotification,
  unconnect,
  unsavePost,
  updateBio,
  updateBirthday,
  updateCommentPermission,
  updateContact,
  updateGender,
  updateName,
  updateNotifications,
  // unconnect,
  updatePost,
  upload,
  userdetails,
  verifyotp,
} from "../controller/usercontroller.js";
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
userrouter.post("/google-login", googlelogin);
userrouter.post("/complete-profile", completeProfile);
userrouter.post("/delete-otp", deleteotp);
userrouter.post("/userdetails", authMiddleware, userdetails);
userrouter.post("/upload", authMiddleware, upload);
userrouter.post("/posting", authMiddleware, posting);
userrouter.get("/posts/explore", explorePosts);
userrouter.get("/allusers", allusers);
userrouter.post("/request", authMiddleware, request);
userrouter.get("/notifications", authMiddleware, notifications);
userrouter.post("/notificationdelete", authMiddleware, notificationdelete);
userrouter.post("/confirmnotification", authMiddleware, confirmnotification);
userrouter.get("/feed", authMiddleware, getFeedPosts);
userrouter.get("/image", authMiddleware, getimage);
userrouter.post("/like-post", authMiddleware, likePost);
userrouter.post("/add-comment", authMiddleware, addComment);
userrouter.post("/delete-comment", authMiddleware, deleteComment);
userrouter.get("/notes", authMiddleware, notes);
userrouter.post("/note", authMiddleware, note);
userrouter.put("/update-post/:postId", authMiddleware, updatePost);
userrouter.delete("/delete-post/:postId", authMiddleware, deletePost);
userrouter.post("/deleted", authMiddleware, deletedimg);
// userrouter.post("/cancel-request", authMiddleware,cancelRequest);
// userrouter.post("/unconnect", authMiddleware,unconnect);
// userrouter.get("/connection-status/:username", authMiddleware,connectionStatus);
userrouter.post("/send-post-to-chats", authMiddleware, sendPostToChats);
userrouter.post("/updateGender", authMiddleware, updateGender);
userrouter.post("/updateBio", authMiddleware, updateBio);
userrouter.post("/updateNotifications", authMiddleware, updateNotifications);
userrouter.post("/changePassword", authMiddleware, changePassword);
userrouter.post(
  "/updateCommentPermission",
  authMiddleware,
  updateCommentPermission,
);
userrouter.post("/getUserSettings", authMiddleware, getUserSettings);
userrouter.post("/addContact", authMiddleware, addContactNumber);
userrouter.get("/getContacts", authMiddleware, getContacts);
userrouter.post("/deleteContact", authMiddleware, deleteContact);
userrouter.post("/updateContact", authMiddleware, updateContact);
userrouter.post("/updateBirthday", authMiddleware, updateBirthday);
userrouter.post("/testNotification", authMiddleware, testNotification);
userrouter.post("/updateName", authMiddleware, updateName);
userrouter.post("/send-post-to-chats", authMiddleware, sendPostToChats);
userrouter.post("/save-post", authMiddleware, savePost);

userrouter.get("/get-saved-posts", authMiddleware, getSavedPosts);
userrouter.get("/profile/:userId", authMiddleware, getProfile);
userrouter.delete("/unsave/:postId", authMiddleware, unsavePost);
userrouter.post("/unconnect", authMiddleware, unconnect);
userrouter.post("/checkconnecting", authMiddleware, checkconnecting);
userrouter.get( "/connection-status/:username", authMiddleware, connectionStatus,);
userrouter.get("/:type", authMiddleware, getConnections);
userrouter.post("/remove-connection", authMiddleware, removeConnection);

export default userrouter;
