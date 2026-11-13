const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticate = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/rooms', chatController.getRooms);
router.post('/rooms', chatController.createGroupRoom);
router.post('/direct', chatController.getOrCreateDirectChat);
router.get('/rooms/:id', chatController.getRoomById);
router.get('/rooms/:id/messages', chatController.getMessages);
router.post('/rooms/:id/messages', chatController.sendMessage);
router.post('/rooms/:id/read', chatController.markAsRead);

module.exports = router;
