const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const Profile = require('./../models/Profile');

const auth = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;

    req.profile = await Profile.findById(req.user.id).select('-password');

    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = auth;
