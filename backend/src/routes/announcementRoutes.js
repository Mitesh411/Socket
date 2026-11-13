const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');

router.use(authenticate);

router.get('/', notificationController.getAnnouncements);
router.post('/', authorize('super_admin', 'college_admin', 'faculty'), notificationController.createAnnouncement);

module.exports = router;
