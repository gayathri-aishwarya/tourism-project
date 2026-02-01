const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);
router.get("/me", authController.getMe);

// Routes for forgot password
router.post("/forgot-password", authController.forgotPassword); // send OTP/email
router.post("/verify-otp", authController.verifyOtp); //verify OTP
router.post("/reset-password", authController.resetPassword);   // reset with OTP/token

module.exports = router;
