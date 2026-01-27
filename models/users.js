import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true
    },
    password: {
      type: String,
    },
    name: {
      type: String, 
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: "https://i.pravatar.cc/150",
    },
    role: {
      type: String, // "Admin" or "User"
    },
    ip: {
      type: String,
    },
    device: {
      type: String,
    },
    time: {
      type: Date,
      default: Date.now,
    },
    img:{
      type:String,
    }
        
  },
  { timestamps: true },
);

const userModel = mongoose.model("users", userSchema);

export default userModel;
