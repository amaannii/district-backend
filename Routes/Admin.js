import express from "express"
import { adminlogin } from "../controller/Admincontroller.js"

const adminrouter=express()


adminrouter.post("/admin-login",adminlogin)


export default adminrouter