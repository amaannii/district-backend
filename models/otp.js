import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

otp:Number,
email:String

});


const otpModel = mongoose.model("otp", userSchema);

export default otpModel;
