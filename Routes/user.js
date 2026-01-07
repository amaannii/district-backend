import express from "express"
import { sendotp, signup, verifyotp } from "../controller/usercontroller.js"


const userrouter=express()

userrouter.post('/send-otp',sendotp)
userrouter.post('/verify-otp',verifyotp)
userrouter.post('/signup',signup)


export default userrouter