import express from "express"
import { sendotp, verifyotp } from "../controller/usercontroller.js"

const userrouter=express.Router()

router.post('/send-otp',sendotp)
router.post('/verify-otp',verifyotp)


export default userrouter