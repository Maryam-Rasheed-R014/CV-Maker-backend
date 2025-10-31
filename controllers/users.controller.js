import jwt from "jsonwebtoken";
import User from "../models/auth.model.js";    
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

import crypto from "crypto";
import { transporter } from "../config/mailer.js";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const createNewUser = async (req, res) => {
    try {
        const { firstName, lastName, education, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }   
        const newUser = new User({ firstName, lastName, education, email, password });
        await newUser.save();
       return  res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }   
};
 



export  const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }       
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
           const payload = {
      userId: user._id,
      email: user.email,
      name: user.firstName,
      
    };

    // 🔹 Generate token (expires in 7 days)
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
          res.status(200).json({
      message: "Login successful",
      token,
     
    });

  }
    
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }           

};




export const resetPasswordRequest = async (req, res) => {
  const { email } = req.body;

  try {
    // 1️⃣ Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2️⃣ Create reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // 3️⃣ Create reset link
    const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

    // 4️⃣ Define email content
    const mailOptions = {
      from: `"CV Maker" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <h3>Password Reset</h3>
        <p>Hello ${user.firstName || ""},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    // 5️⃣ Send email via Nodemailer
    const resss = await transporter.sendMail(mailOptions);
    console.log(resss);
    

    res.status(200).json({ message: "Password reset email sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};







export const resetPassword = async (req, res) => {
  const { token } = req.params;   
  const { password } = req.body; 

  try {
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }


    user.password = password;


    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

