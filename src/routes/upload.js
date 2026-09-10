const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Faqat rasm fayllari (jpeg, png, etc) yuklash mumkin.'));
    }
  }
});

router.post('/', upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Fayl topilmadi' });
    }
    
    // Yaratilgan fayl URL manzilini qaytaramiz
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    res.json({ avatar_url: avatarUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Rasm yuklashda xatolik yuz berdi' });
  }
});

module.exports = router;
