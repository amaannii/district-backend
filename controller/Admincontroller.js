import jwt from "jsonwebtoken";
import dotenv from "dotenv"

dotenv.config()

const adminemail="admin@gmail.com"
const adminpassword="admin123"


const adminlogin=(req,res)=>{
const {email,password}=req.body
if(email===adminemail&&password===adminpassword){
    const token = jwt.sign(
      {
        role: "admin",
        email: adminemail,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
    return res.status(200).json({
      success: true,
      token, // 👈 send token to frontend
    });
}else{
     return res.status(401).json({
    success: false,
    message: "Invalid admin credentials",
  });
}
}


export{
    adminlogin,
}