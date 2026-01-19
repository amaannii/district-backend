import express from "express"
import { adminlogin, getAdmins, getAllMessages, getAllUsers, toggleBlockUser } from "../controller/Admincontroller.js"

const adminrouter=express()


adminrouter.post("/admin-login",adminlogin)
adminrouter.get("/users", getAllUsers);
adminrouter.patch("/users/:id/block", toggleBlockUser);
adminrouter.get("/messages",getAllMessages);
adminrouter.get("/admins", getAdmins);




export default adminrouter