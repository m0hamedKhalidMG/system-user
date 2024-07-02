const mongoose = require('mongoose');
const DiseaseSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    documents: [
      {
        type: String, // or mongoose.Schema.Types.ObjectId if documents are separate entities
      },
    ],
  });
  const ProfileSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    nationalId: {
      type: String,
      required: true,
    },
    secureHealth: {
      type: String,
      required: true,
    },
    diseases: [DiseaseSchema],
  });
  
module.exports = mongoose.model('Profile', ProfileSchema);
