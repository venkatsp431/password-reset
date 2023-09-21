import express from "express";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import crypto from "crypto";
import mongoose from "mongoose";

const app = express();
app.use(bodyParser.json());

// const router = express.Router();

// MongoDB setup
mongoose.connect(
  "mongodb+srv://venki31:venki31@cluster0.bkititm.mongodb.net/?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);
const User = mongoose.model("User", {
  email: String,
  password: String,
  resetToken: String,
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "sealvenki@gmail.com",
    pass: "hpuv xape ilsd bwgr",
  },
});

app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  // Check if the user with the same email already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(409).json({ message: "User already exists" });
  }

  // Create a new user and set the password
  const newUser = new User({ email, password });

  try {
    await newUser.save();
    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error registering user" });
  }
});

// Route to get a list of all users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find(); // Fetch only the email field
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching users" });
  }
});

// Route to handle "Forgot Password" form submission
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  // Check if the user exists in the database
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Generate a random token
  const token = crypto.randomBytes(20).toString("hex");

  // Store the token in the database
  user.resetToken = token;
  await user.save();

  // Send an email with the reset password link
  const mailOptions = {
    to: email,
    subject: "Password Reset",
    text: `To reset your password, click on this link: http://your-app/reset-password/${token}`,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ message: "Error sending email" });
    }

    return res.status(200).json({ message: "Email sent successfully" });
  });
});

app.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    const { password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "No user found" });
    }

    // Check if the user has a password
    if (!user.password) {
      return res
        .status(400)
        .json({ message: "No password found for this user" });
    }

    // Convert both passwords to lowercase (or uppercase) for case-insensitive comparison
    if (user.password.toLowerCase() === password.toLowerCase()) {
      return res.status(200).json({ message: "Login successful" });
    } else {
      return res.status(400).json({ message: "Password doesn't match" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route to handle password reset
app.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  // Find the user with the matching token
  const user = await User.findOne({ resetToken: token });

  if (!user) {
    return res.status(400).json({ message: "Invalid token" });
  }

  // Update the user's password and clear the token
  user.resetToken = undefined;
  user.password = newPassword;
  await user.save();

  return res.status(200).json({ message: "Password reset successfully" });
});

app.listen(9000, () => {
  console.log("Server is running on port 9000");
});
