const express = require("express");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const Profile = require("../models/Profile");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const {
    phoneNumber,
    nationalId,
    email,
    password,
    first_name,
    last_name,
    role,
    address,
    n_floor,
    n_house,
    location,
    diseases,
  } = req.body;

  // Validate that either address fields or location is provided
  const addressFields = address && n_floor && n_house;
  const locationFields =
    location && location.coordinates && location.coordinates.length === 2;
  if (!addressFields && !locationFields) {
    return res
      .status(400)
      .json({ message: "Either a full address or location must be provided." });
  }

  try {
    let user = await Profile.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    user = new Profile({
        phoneNumber,
        nationalId,
        email,
        password,
        first_name,
        last_name,
        role,
        address,
        n_floor,
        n_house,
        location,
        diseases,
      });
      await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "3h" });

    res.json({ token });
  } catch (err) {
    console.log(err)
    res.status(500).json({  err });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Profile.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "5h" });

    res.json({ token });
  } catch (err) {
    console.log(err)
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
