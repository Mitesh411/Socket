const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const collegeRoutes = require('./collegeRoutes');
const chatRoutes = require('./chatRoutes');
const notificationRoutes = require('./notificationRoutes');
const announcementRoutes = require('./announcementRoutes');

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/colleges', collegeRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/announcements', announcementRoutes);

module.exports = router;
