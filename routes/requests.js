
const express = require('express');
const auth = require('../middleware/auth');
const RequestsCar = require('../models/requestCars');

const router = express.Router();



router.get('/history', auth,  async (req, res) => {

  try {
    console.log( req.profile)
    const requests = await RequestsCar.find({ nationalid: req.profile.nationalId }).populate('assignedCars').populate('assignedHospital');

    if (requests.length === 0) {
      return res.status(404).json({ message: "No requests found for the provided national ID" });
    }

    return res.json(requests);
  } catch (error) {
    console.error("Error retrieving requests:", error);
    return res.status(500).json({ error: error.message });
  }
});
module.exports = router;
