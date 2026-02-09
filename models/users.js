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
      sparse: true,
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

    img: {
      type: String,
    },

   post: [
  {
    image: String,
    caption: String,
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
        },
        username: String,
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
],


    request: [
      {

        username: String,
        name: String,
        img: String,
        Date:Date
      },
    ],


    connected: [
      {

        username: String,
        name: String,
        img: String,
        Date:Date
      },
    ],


    connecting: [
      {

        username: String,
        name: String,
        img: String,
        Date:Date
      },
    ],

      note: {
    type: String,
    default: "",
  },

  noteCreatedAt: {
    type: Date,
  },
  },

  { timestamps: true },
);

const userModel = mongoose.model("users", userSchema);

export default userModel;
