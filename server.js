import express from "express"
import connected from "./database/connect.js";
import dotenv, { config } from "dotenv"

dotenv.config()

const app=express()

connected


app.listen(3000,()=>{
console.log("server is connected succefully");

})