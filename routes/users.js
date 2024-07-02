const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');

const router = express.Router();

// GET current user's profile
router.get('/me', auth, async (req, res) => {
  try {
    // Find user by ID and exclude password field
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Find profile for the user
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    // Combine user and profile data
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profile: {
        phoneNumber: profile.phoneNumber,
        nationalId: profile.nationalId,
        secureHealth: profile.secureHealth,
        diseases: profile.diseases,
        documents: profile.documents,
      },
    };

    res.json(userData);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
