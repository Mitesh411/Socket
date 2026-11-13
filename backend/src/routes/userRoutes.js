const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');

router.use(authenticate);

router.get('/', userController.listUsers);
router.get('/online', userController.getOnlineUsers);
router.get('/students', userController.listStudents);
router.get('/faculty', userController.listFaculty);
router.get('/:id', userController.getUserById);
router.put('/:id', authorize('super_admin', 'college_admin'), userController.updateUser);
router.delete('/:id', authorize('super_admin', 'college_admin'), userController.deleteUser);

module.exports = router;
