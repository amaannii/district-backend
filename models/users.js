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
        createdAt: { type: Date, default: Date.now },

        likes: { type: Number, default: 0 },
        likedBy: { type: [mongoose.Schema.Types.ObjectId], default: [] },

        comments: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              required: true,
            },
            username: {
              type: String,
              required: true,
            },
            text: {
              type: String,
              required: true,
            },
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],


        default: [],
      },
    ],

    // request: [
    //   {
    //     username: String,
    //     name: String,
    //     img: String,
    //     Date: Date,
    //   },
    // ],
            
savedPosts: [
  {
    postId: { type: mongoose.Schema.Types.ObjectId },
    username: String,
    savedAt: { type: Date, default: Date.now },
  }
],

request: {
  type: [
    {
      username: String,
      name: String,
      img: String,
      Date: Date,
    },
  ],
  default: [],
},

connected: {
  type: [
    {
      username: String,
      name: String,
      img: String,
      Date: Date,
    },
  ],
  default: [],
},

connecting: {
  type: [
    {
      username: String,
      name: String,
      img: String,
      Date: Date,
    },
  ],
  default: [],
},
    note: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: 250,
      default: "",
    },


   commentsPermission: {
  type: String,
  enum: ["all", "followers", "followback", "off"],
  default: "all",
},

    contacts: {
      type: [String],
      default: [],
    },

    notifications: {
      enabled: {
        type: Boolean,
        default: true,
      },
      duration: {
        type: String,
        default: "for 2 days",
      },
    },
      birthday: {
    month: { type: String },
    day: { type: String },
    year: { type: String },
  },

    noteCreatedAt: {
      type: Date,
    },
  },

  { timestamps: true },
);

const userModel = mongoose.model("users", userSchema);

export default userModel;
