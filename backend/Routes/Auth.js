import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userModel } from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import transporter from "../config/mailer.js";

const router = express.Router();

router.post("/check-user", async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await userModel.findOne({ email });
    res.status(200).json({ exists: !!existingUser });
  } catch (error) {
    console.error("User Check Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  try {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.findOneAndUpdate(
      { email },
      { code: otpCode, createdAt: new Date() },
      { upsert: true, new: true }
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your verification code is ${otpCode}. It will expire in 30 minutes.`,
    });

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { email, code } = req.body;

  try {
    const otpEntry = await Otp.findOne({ email });

    if (!otpEntry) {
      return res.status(400).json({ message: "No OTP found for this email" });
    }

    if (otpEntry.code !== code) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const expired =
      new Date().getTime() - new Date(otpEntry.createdAt).getTime() >
      30 * 60 * 1000;
    if (expired) {
      await Otp.deleteOne({ email });
      return res.status(400).json({ message: "OTP expired" });
    }

    await Otp.deleteOne({ email }); // Invalidate OTP after success
    res.status(200).json({ success: true, message: "OTP verified" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({ name, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, name: newUser.name },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "User created successfully",
      token,
      user: { name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: { name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
