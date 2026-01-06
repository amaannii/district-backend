import express from "express"
import connected from "./database/connect.js";
import dotenv from "dotenv"
import cors from "cors"
import router from "./Routes/Admin.js";
import nodemailer from 'nodemailer';
import userrouter from "./Routes/user.js";


dotenv.config()

const app=express()

connected

app.use(express.json());


app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true 
}));


app.use("/Admin",router)
app.use("/user",userrouter)

// Temporary OTP storage
const otpStore = {};

// Generate 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});







app.listen(3000,()=>{
console.log("server is connected succefully");

})