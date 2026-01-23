import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

const authMiddleware = (req, res, next) => {

  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Store user data in request (VERY IMPORTANT)
    req.user = {
      email: decoded.email,
      role: decoded.role,
    };

    next(); // allow request to continue
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
