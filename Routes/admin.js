import express from "express"
import { adminlogin, blockUser, deleted, dismissReport, getAdmins, getAllMessages, getAllUsers, getLoginLogs,  getReports,  logout,  toggleBlockUser } from "../controller/Admincontroller.js"
import authMiddleware from "../middleware/authMiddleware.js";

const adminrouter=express()


adminrouter.post("/admin-login",adminlogin)
adminrouter.get("/users", getAllUsers);
adminrouter.patch("/users/:id/block", toggleBlockUser);
adminrouter.get("/messages",getAllMessages);
adminrouter.get("/admins", getAdmins);
adminrouter.get("/login-logs", getLoginLogs);
adminrouter.get("/reports", getReports);                 
adminrouter.patch("/reports/:id/block", blockUser);   
adminrouter.patch("/reports/:id/dismiss", dismissReport); 
adminrouter.delete("/delete-message/:id", deleted)
adminrouter.post("/logout",authMiddleware, logout)




export default adminrouter
