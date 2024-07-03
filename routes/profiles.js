const express = require("express");
const auth = require("../middleware/auth");
const Profile = require("../models/Profile");
const multer = require("multer");
const fs = require("fs").promises; 
const path = require("path");
const bucket = require('../firebase'); // Firebase bucket initialized from firebase.js
const axios = require("axios");
const RequestsCar = require("../models/requestCars");
const {createAmbulanceRequest} = require("../socketServer");

const router = express.Router();


const upload = multer({
    storage: multer.memoryStorage(),
    // Limiting file size to 10MB
  limits: { fileSize: 10 * 1024 * 1024 },
 
  
}).array("documents");
// Endpoint to upload documents
router.post("/upload-documents", upload, (req, res) => {
  if (!req.files) {
    return res.status(400).json({ msg: "No files uploaded" });
  }

  const filePaths = req.files.map((file) => file.path);
  res.json({ filePaths });
});

router.post("/add-disease", auth, async (req, res) => {
    
    
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ msg: 'Multer error: ' + err.message });
        } else if (err) {
          return res.status(400).json({ msg: 'File upload error: ' + err.message });
        }
    const { name ,description,doctorname} = req.body;
    const files = req.files;

    if (!name || files.length === 0) {
      return res.status(400).json({ msg: 'Please provide name and upload documents' });
    }
  
    try {
      let profile = await Profile.findById(req.user.id);
  
      if (!profile) {
        return res.status(404).json({ msg: 'Profile not found' });
      }
  
      const uploadPromises = files.map(async (file) => {
        const filename = `${Date.now()}-${file.originalname}`;
        const fileUpload = bucket.file(filename);
  
        await fileUpload.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
          },
        });
  
        return {
          name: file.originalname,
          url: `https://storage.googleapis.com/${bucket.name}/${filename}`, // Update with your storage bucket URL
        };
      });
  
      const documents = await Promise.all(uploadPromises);
  
      // Check if the disease already exists for the user
      const existingDiseaseIndex = profile.diseases.findIndex((disease) => disease.name === name);
  
      if (existingDiseaseIndex !== -1) {
        // Disease with the same name exists, add files to it
        profile.diseases[existingDiseaseIndex].documents.push(...documents);
      } else {
        // Disease does not exist, create a new entry
        const newDisease = {
          name,
          description,
          doctorname,
          documents,
        };
        profile.diseases.push(newDisease);
      }
  
      profile = await profile.save();
      res.json(profile);
    } catch (err) {
      console.error('Error adding or updating disease:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  });  });

router.delete("/delete-disease/:diseaseId", auth, async (req, res) => {
  const diseaseId = req.params.diseaseId;

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ msg: "Profile not found" });
    }

    // Find index of disease to delete
    const removeIndex = profile.diseases.findIndex(
      (disease) => disease._id.toString() === diseaseId
    );

    if (removeIndex === -1) {
      return res.status(404).json({ msg: "Disease not found in profile" });
    }

    // Remove disease from array
    profile.diseases.splice(removeIndex, 1);
    profile = await profile.save();

    res.json(profile);
  } catch (err) {
    console.error("Error deleting disease:", err);
    res.status(500).json({ msg: "Server error" });
  }
});
router.delete(
  "/delete-document/:diseaseId/:documentId",
  auth,
  async (req, res) => {
    const diseaseId = req.params.diseaseId;
    const documentId = req.params.documentId;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        return res.status(404).json({ msg: "Profile not found" });
      }

      // Find the disease by diseaseId
      const disease = profile.diseases.find(
        (disease) => disease._id.toString() === diseaseId
      );

      if (!disease) {
        return res.status(404).json({ msg: "Disease not found in profile" });
      }

      const document = disease.documents.find(
        (doc) => doc.toString() === `${documentId}`
      );

      if (!document) {
        return res.status(404).json({ msg: "Document not found in disease" });
      }

      // Delete document file from server
      const filePath = path.join(__dirname, "..", "uploads", document);

      await fs.unlink(filePath);

      // Remove document from array
      disease.documents = disease.documents.filter(
        (doc) => doc.toString() !== documentId
      );

      // Save updated profile
      profile = await profile.save();

      res.json(profile);
    } catch (err) {
      console.error("Error deleting document:", err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);


router.post("/newrequest",createAmbulanceRequest);
module.exports = router;
