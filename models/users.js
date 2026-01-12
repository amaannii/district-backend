import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

  email: {
    type: String,
    unique: true,
  },
  username: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  name: {
    type: String,
  },
});


const userModel = mongoose.model("users", userSchema);

export default userModel;
