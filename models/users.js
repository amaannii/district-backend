
import mongoose from "mongoose"

 const userSchema = new mongoose.Schema({

    email:String,
    password:String,
    name:String,
    username:String,
 
 })

 const userModel=mongoose.model("users",userSchema)

export default userModel