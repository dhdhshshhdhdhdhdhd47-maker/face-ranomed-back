const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

router.get('/admin', authMiddleware(['admin']), dashboardController.adminStats);
router.get('/director', authMiddleware(['director']), dashboardController.directorStats);

module.exports = router;
