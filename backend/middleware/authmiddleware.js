import jwt from "jsonwebtoken";
import { userModel } from "../models/user.model.js";

// Middleware function to authenticate users based on the JWT provided in the request header
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if the Authorization header is missing or doesn't start with "Bearer "
    // This ensures the request includes a valid Bearer token before proceeding
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No Valid token provided" });
    }

    // Extract the JWT token from the "Authorization" header
    const token = authHeader.split(" ")[1];

    // Verify and decode the token using the secret key to retrieve the payload (including user ID).
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Look up the user in the database by the decoded user ID, excluding the password field.
    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};
