const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware(['admin', 'director']), payrollController.getAll);
router.get('/user/:userId', payrollController.getByUser);
router.post('/calculate', authMiddleware(['admin']), payrollController.calculate);
router.get('/export/excel', authMiddleware(['admin']), payrollController.exportExcel);
router.put('/status', authMiddleware(['admin']), payrollController.updateStatus);
router.put('/:id/status', authMiddleware(['admin']), payrollController.updateSingleStatus);
router.put('/:id/advance', authMiddleware(['admin']), payrollController.setAdvance);

module.exports = router;
