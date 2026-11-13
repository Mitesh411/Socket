const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.post('/', authorize('super_admin', 'college_admin', 'faculty'), notificationController.sendNotification);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
