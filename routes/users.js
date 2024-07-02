const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');

const router = express.Router();

// GET current user's profile
router.get('/me', auth, async (req, res) => {
  try {
    // Find user by ID and exclude password field
    
console.log(req.user.id)
    // Find profile for the user
    const profile = await Profile.findById(req.user.id ).select('-password');

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

   

    res.json(profile);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
