const express = require('express');

const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware(['admin', 'director']), employeeController.getAll);
router.get('/departments', authMiddleware(['admin', 'director']), employeeController.getDepartments);
router.get('/phone/:phone', employeeController.findByPhone);
router.get('/:id', authMiddleware(['admin', 'director']), employeeController.getById);
router.post('/', authMiddleware(['admin']), employeeController.create);
router.put('/:id', authMiddleware(['admin']), employeeController.update);
router.put('/:id/telegram', employeeController.updateTelegramChatId);
router.delete('/:id', authMiddleware(['admin']), employeeController.delete);

module.exports = router;
