const authService = require("../services/auth.service");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");


const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        message:
          "Please provide firstName, lastName, email, phone and password",
      });
    }
    const newUser = await authService.register({
      firstName,
      lastName,
      email,
      phone,
      password,
    });
    res.status(201).json(newUser);
  } catch (error) {
    if (error.message === "User with this email already exists.") {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res
        .status(400)
        .json({ message: "Please provide both email and password." });
    }

    const { user, token } = await authService.login({ email, password });
    res.status(200).json({ user, token });
  } catch (error) {
    // Handle specific errors from the service (e.g., wrong credentials)
    if (error.message === "Invalid email or password.") {
      return res.status(401).json({ message: error.message }); // HTTP 401: Unauthorized
    }
    // Pass other errors to the global error handler
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { id, name, email, image } = req.body;
    if (!id || !email || !name) {
      return res.status(400).json({ message: "Missing Google user data" });
    }

    const { user, token } = await authService.loginWithGoogle({
      id,
      name,
      email,
      image,
    });

    res.status(200).json({ user, token });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Please enter your email." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // --- Resend limit logic ---
   /* const now = Date.now();
    if (user.otpRequestTime && now - user.otpRequestTime.getTime() < 10 * 60 * 1000) {
      // within 10-min window
      if (user.otpRequestCount >= 5) {
        return res
          .status(429)
          .json({ message: "You have reached the maximum OTP requests. Try again later." });
      } else {
        user.otpRequestCount += 1;
      }
    } else {
      // reset window
      user.otpRequestTime = new Date();
      user.otpRequestCount = 1;
    } */

    // --- Generate 6-digit OTP ---
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated OTP:", otp);


    user.resetPasswordToken = otp;
    user.resetPasswordExpires = Date.now() + 12 * 60 * 1000; // 12 minutes
    await user.save();

    user.isOtpVerified = false;

    // --- Send email via Ethereal ---
    let testAccount = await nodemailer.createTestAccount();
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, 
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
        tls: {
          rejectUnauthorized: false,
        },
    });

    let info = await transporter.sendMail({
      from: '"My App" <no-reply@myapp.com>',
      to: user.email,
      subject: "Your OTP Code",
      html: `<p>Hi ${user.firstName},</p>
             <p>Your 6-digit OTP is: <b>${otp}</b></p>
             <p>It expires in 12 minutes.</p>`,
    });

    console.log("OTP preview URL:", nodemailer.getTestMessageUrl(info));

    res.json({
      message: "OTP sent to email",
      previewURL: nodemailer.getTestMessageUrl(info),
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR 👇");
  console.error(error);
  console.error(error.stack);
  res.status(500).json({ message: error.message });
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordToken) {
      return res.status(400).json({ message: "Invalid request." });
    }

    // Check OTP match
    if (user.resetPasswordToken !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Check expiry
    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    // OTP is valid → clear it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.isOtpVerified= true;

    await user.save();

    res.json({ message: "OTP verified successfully." });
  } catch (error) {
    next(error);
  }
};


const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.isOtpVerified) {
  return res.status(403).json({ message: "OTP verification required." });
 }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      });
    }

 // Update password (authService should hash it if needed)

    user.password = await bcrypt.hash(newPassword, 12);
    user.isOtpVerified = false;
    await user.save();


    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    //Fetch user from MongoDB
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  googleLogin,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
