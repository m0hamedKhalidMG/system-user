const express = require("express");
const auth = require("../middleware/auth");
const Profile = require("../models/Profile");
const multer = require("multer");
const fs = require("fs").promises; // Using promises for fs methods
const path = require("path");

const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  // Limiting file size to 10MB
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Allow only pdf files
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
}).array("documents");
// Endpoint to upload documents
router.post("/upload-documents", upload, (req, res) => {
  if (!req.files) {
    return res.status(400).json({ msg: "No files uploaded" });
  }

  const filePaths = req.files.map((file) => file.path);
  res.json({ filePaths });
});
router.post("/", auth, async (req, res) => {
  const { phoneNumber, nationalId, secureHealth, diseases } = req.body;

  const profileFields = {
    user: req.user.id,
    phoneNumber,
    nationalId,
    secureHealth,
    diseases,
  };

  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (profile) {
      // Update existing profile
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );
      return res.json(profile);
    }

    // Create new profile if none exists
    profile = new Profile(profileFields);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error("Error saving/updating profile:", err);
    res.status(500).json({ msg: "Server error" });
  }
});
router.post("/add-disease", auth, async (req, res) => {
  const { name, documents } = req.body;

  // Validate input
  if (!name || !documents || !Array.isArray(documents)) {
    return res
      .status(400)
      .json({ msg: "Please provide name and documents (as an array)" });
  }

  // Prepare new disease object
  const newDisease = {
    name,
    documents,
  };

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ msg: "Profile not found" });
    }

    // Add new disease to profile
    profile.diseases.push(newDisease);
    profile = await profile.save();

    res.json(profile);
  } catch (err) {
    console.error("Error adding disease:", err);
    res.status(500).json({ msg: "Server error" });
  }
});
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
module.exports = router;
