import express from "express"
import { login, resetpassword, sendotp, signup, verifyotp } from "../controller/usercontroller.js"


const userrouter=express()

userrouter.post('/send-otp',sendotp)
userrouter.post('/verify-otp',verifyotp)
userrouter.post('/signup',signup)
userrouter.post('/login',login)
userrouter.post('/reset-password',resetpassword)




export default userrouter