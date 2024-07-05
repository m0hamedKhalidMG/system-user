const express = require('express');
const auth = require('../middleware/auth');
const Hospital = require('../models/Hospitals');

const router = express.Router();


router.get('/details', auth, async (req, res) => {
  try {
    const hospitals = await Hospital.find();

    if (hospitals.length === 0) {
      return res.status(404).json({ message: "No hospitals found" });
    }

    return res.json(hospitals);
  } catch (error) {
    console.error("Error retrieving hospitals:", error);
    return res.status(500).json({ error: error.message });
  }
});
module.exports = router;
