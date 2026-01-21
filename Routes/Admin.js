import express from "express"
import { adminlogin, blockUser, dismissReport, getAdmins, getAllMessages, getAllUsers, getLoginLogs,  getReports,  toggleBlockUser } from "../controller/Admincontroller.js"

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




export default adminrouter