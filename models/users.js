
import mongoose from "mongoose"

 const userSchema = new mongoose.Schema({

    Email:String,
    Password:String,
    Name:String,
 
 })

 const userModel=mongoose.model("users",userSchema)

export default userModel