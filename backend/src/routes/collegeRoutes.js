const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');

router.use(authenticate);

// Colleges
router.get('/', collegeController.getAllColleges);
router.post('/', authorize('super_admin'), collegeController.createCollege);
router.get('/:id', collegeController.getCollegeById);
router.put('/:id', authorize('super_admin', 'college_admin'), collegeController.updateCollege);

// Departments
router.get('/:id/departments', collegeController.getDepartments);
router.post('/:id/departments', authorize('super_admin', 'college_admin'), collegeController.createDepartment);

// Generic Dept / Course / Batch sub-routes
router.get('/departments/list', collegeController.getDepartments);
router.post('/departments/create', authorize('super_admin', 'college_admin'), collegeController.createDepartment);
router.get('/courses/list', collegeController.getCourses);
router.post('/courses/create', authorize('super_admin', 'college_admin'), collegeController.createCourse);
router.get('/batches/list', collegeController.getBatches);
router.post('/batches/create', authorize('super_admin', 'college_admin'), collegeController.createBatch);

module.exports = router;
