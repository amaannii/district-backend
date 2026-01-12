import nodemailer from "nodemailer";
import dotenv from "dotenv";
import userModel from "../models/users.js";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

const otpStore = {}; // 👈 MUST be here (top of file)

const sendotp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const otp = Math.floor(10000 + Math.random() * 90000);

  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  console.log("OTP for", email, otp, otpStore[email]);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}. Valid for 5 minutes.`,
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

const verifyotp = async (req, res) => {
  let { email, otp } = req.body;

  email = email.trim().toLowerCase();

  console.log("Frontend OTP:", otp);
  console.log("Stored OTP:", otpStore[email].otp);

  if (!otpStore[email].otp) {
    return res.status(400).json({ message: "OTP expired or not found" });
  }

  if (otpStore[email].otp.toString() === otp.toString()) {
    delete otpStore[email];
    return res.json({ message: "OTP verified successfully", status: true });
  }

  return res.status(400).json({ message: "Invalid OTP" });
};

const signup = (req, res) => {
  console.log(req.body);
  const { email, password, username, name } = req.body;
  const users = new userModel({
    email: email,
    password: password,
    username: username,
    name: name,
  });
  users
    .save()
    .then(() => {
      res.json({ success: true });
    })

    .catch((err) => {
      console.log(err);
    });
};

const login =async(req,res)=>{
const {email,password}=req.body
const users=await userModel.findOne({email:email,password:password})
  if (users) {
    res.json({ success: true })
  } else {
    res.json({ success: false })
  }
}





export { sendotp, verifyotp, signup,login};
