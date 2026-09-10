const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/auth');

// Turniket webhook (autentsifikatsiyasiz - turniket qurilmasi yuboradi)
router.post('/turnstile/webhook', attendanceController.turnstileWebhook);

// Davomat loglari
router.get('/', authMiddleware(['admin', 'director']), attendanceController.getAll);

// Tugallanmagan (check-out yo'q) yozuvlar
router.get('/incomplete', authMiddleware(['admin']), attendanceController.getIncomplete);

// Qo'lda tahrirlash
router.put('/:id/override', authMiddleware(['admin']), attendanceController.override);

module.exports = router;
