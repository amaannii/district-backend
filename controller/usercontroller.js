import nodemailer from "nodemailer";
import dotenv from "dotenv";
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

  console.log("OTP for", email, otp);

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
  const { email, otp } = req.body;
  console.log(otp);
  console.log(otpStore[email]);

  if (!otpStore[email]) {
    return res.status(400).json({ message: "OTP expired or not found" });
  }

  if (otpStore[email].otp === otp) {
    delete otpStore[email]; // clear OTP after success
    return res.json({ message: "OTP verified successfully" });
  } else {
    return res.status(400).json({ message: "Invalid OTP" });
  }
};

const signup = (req, res) => {
  console.log(req.body);

  res.json({ message: "Signup success" });
};

export { sendotp, verifyotp, signup };
