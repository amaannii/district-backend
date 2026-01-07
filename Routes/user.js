import express from "express"
import { sendotp, verifyotp } from "../controller/usercontroller.js"


const userrouter=express()

userrouter.post('/send-otp',sendotp)
userrouter.post('/verify-otp',verifyotp)


export default userrouter