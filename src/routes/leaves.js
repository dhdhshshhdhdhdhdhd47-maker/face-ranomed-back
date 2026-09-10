const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware(['admin', 'director']), leaveController.getAll);
router.post('/', authMiddleware(), leaveController.create);
router.put('/:id/status', authMiddleware(['admin']), leaveController.updateStatus);

module.exports = router;
