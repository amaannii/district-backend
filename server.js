import express from "express"
import connected from "./database/connect.js";
import dotenv from "dotenv"
import cors from "cors"
import nodemailer from 'nodemailer';
import userrouter from "./Routes/user.js";
import adminrouter from "./Routes/Admin.js";


dotenv.config()

const app=express()

connected

app.use(express.json());


app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true 
}));


app.use("/Admin",adminrouter)
app.use("/user",userrouter)










app.listen(3001,()=>{
console.log("server is connected succefully");

})