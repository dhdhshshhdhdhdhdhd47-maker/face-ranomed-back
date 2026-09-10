const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware(['admin', 'director']), shiftController.getAll);
router.get('/user/:userId', shiftController.getByUser);
router.post('/', authMiddleware(['admin']), shiftController.create);
router.post('/batch', authMiddleware(['admin']), shiftController.createBatch);
router.put('/:id', authMiddleware(['admin']), shiftController.update);
router.delete('/:id', authMiddleware(['admin']), shiftController.delete);

module.exports = router;
