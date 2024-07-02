const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const DiseaseSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
      description: {
        type: String,
        required: true,
      },
      doctorname: {
        type: String,
        required: true,
      },
    documents: [
      {
        type: String, // or mongoose.Schema.Types.ObjectId if documents are separate entities
      },
    ],
  });

const ProfileSchema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
  },
  nationalId: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'user',
  },
  address: {
    type: String,
  },
  n_floor: {
    type: String,
  },
  n_house: {
    type: String,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    }
  },  
  diseases: [DiseaseSchema],


});
ProfileSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
      return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });
  
  ProfileSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };
  
// Custom validation to enforce either address or location
ProfileSchema.path('address').validate(function(value) {
  const addressFields = this.address && this.n_floor && this.n_house;
  const locationFields = this.location && this.location.coordinates && this.location.coordinates.length === 2;
  return addressFields || locationFields;
}, 'Either a full address (address, n_floor, n_house) or location (coordinates) must be provided.');

module.exports = mongoose.model('Profile', ProfileSchema);
