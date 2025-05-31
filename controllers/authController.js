const User = require("../models/User")
const jwt = require("jsonwebtoken")
const sendOTPEmail = require('../utils/email');
const bcrypt = require("bcrypt")
const PendingUser = require("../models/PendingUser");

// Token
const generateToken = (user) => {
    return jwt.sign({
        _id: user._id,
        username: user.username,
        role: user.role
    }, process.env.SECRET)
}

// Login
const loginAuth = async (req, res) => {
    const {username, password} = req.body   
    try {
        const usernameTrimmed = username.trim()
        const passwordTrimmed = password.trim()
        const user = await User.login({username: usernameTrimmed, password: passwordTrimmed})
        const token = generateToken(user)
        res.status(200).json({'token':token, "message": "Login successful", "user": user.username, "role": user.role})
    } catch (error) {
        res.status(400).json(error.message)
    }
}

const sendOTP = async (req, res) => {
  const { username, email, password, confirmPassword, role } = req.body;
  const usernameTrimmed = username.trim()
  const passwordTrimmed = password.trim()
  const confirmPasswordTrimmed = confirmPassword.trim()
  const roleTrimmed = role.trim()
  const emailTrimmed = email.trim()

  if (passwordTrimmed !== confirmPasswordTrimmed)
    return res.status(400).json("Passwords do not match");

  try {

    const existingUser = await User.findOne({ email: emailTrimmed });
    if (existingUser) return res.status(400).json("User already exists");

    const existingUsername = await User.findOne({ username: usernameTrimmed });
    if (existingUsername) return res.status(400).json("Username already exists");

    const existingPending = await PendingUser.findOne({ email: emailTrimmed });
    if (existingPending) await PendingUser.deleteOne({ email: emailTrimmed });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(otp);
    
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);
    const hashedPassword = await bcrypt.hash(passwordTrimmed, salt);

    const pending = new PendingUser({
      username: usernameTrimmed,
      email: emailTrimmed,
      role: roleTrimmed,
      passwordHash: hashedPassword,
      otpHash: hashedOTP,
      otpGeneratedAt: new Date(),
    });

    await pending.save();

    const message = `\nThank you for signing up with our platform. To complete your account verification, please use the following One-Time Password (OTP):\n\n OTP: ${otp}\n\n Please enter this OTP in the designated field on our website to verify your account. Please note that this OTP is valid for a 10 miniutes only.\nIf you did not sign up for an account or have any concerns, please disregard this email.
      \n\nThank you,\nDumyum Chocolates`;
    // await sendOTPEmail({ to: email, subject: "Verify OTP", text: message });

    res.status(200).json({"message": "OTP sent successfully"});
  } catch (err) {
    res.status(500).json(err.message);
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const pending = await PendingUser.findOne({ email });
    if (!pending) return res.status(404).json("No OTP request found");

    const isExpired =
      (Date.now() - new Date(pending.otpGeneratedAt).getTime()) / 60000 > 10;

    if (isExpired) {
      await PendingUser.deleteOne({ email });
      return res.status(401).json("OTP expired");
    }

    const isMatch = await bcrypt.compare(otp, pending.otpHash);
    if (!isMatch) return res.status(401).json("Invalid OTP");

    const user = new User({
      username: pending.username,
      email: pending.email,
      role: pending.role,
      password: pending.passwordHash,
    });

    await user.save();
    await PendingUser.deleteOne({ email });

    const token = generateToken(user);
    res.status(201).json({ token, "message": "Sign up successful", "user": user.username, "role": user.role });
  } catch (err) {
    res.status(500).json(err.message);
  }
};


const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
  
    const user = await User.findOne({ email }); 
    if (!user) return res.status(404).json("User not found");

    // Generate 6-digit OTP string
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    console.log(otp);

    // Hash OTP before saving
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    user.otp = hashedOTP;
    user.otpGenerated = new Date();

    await user.save();

    // Send OTP email
    // await sendOTPEmail({
    //   to: email,
    //   subject: "Password Reset OTP - Dumyum Chocolates",
    //   text: `Your password reset OTP is: ${otp}. It is valid for 10 minutes.\nDumyum Chocolates`,
    // });

    res.status(200).json({ "message": "OTP sent to your email"});
  } catch (error) {
    res.status(500).json(error.message);
  }
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json("Passwords do not match");
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json("User not found");

    const otpAgeMinutes = (Date.now() - new Date(user.otpGenerated).getTime()) / 60000;
    if (otpAgeMinutes > 10) {
      return res.status(400).json( "OTP expired. Please request again." );
    }

    const validOTP = await bcrypt.compare(otp, user.otp);
    if (!validOTP) {
      return res.status(400).json("Invalid OTP");
    }

    // OTP is valid, reset password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear OTP fields
    user.otp = undefined;
    user.otpGenerated = undefined;

    await user.save();

    res.status(200).json({"message": "Password reset successful"});
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  }
};



module.exports = {loginAuth, sendOTP, verifyOTP, forgotPassword, resetPassword}