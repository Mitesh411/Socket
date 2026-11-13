const collegeService = require('../services/collegeService');
const ApiResponse = require('../utils/apiResponse');

class CollegeController {
  // Colleges
  async getAllColleges(req, res, next) {
    try {
      const colleges = await collegeService.getAllColleges();
      return ApiResponse.success(res, colleges);
    } catch (error) {
      next(error);
    }
  }

  async getCollegeById(req, res, next) {
    try {
      const college = await collegeService.getCollegeById(req.params.id);
      return ApiResponse.success(res, college);
    } catch (error) {
      next(error);
    }
  }

  async createCollege(req, res, next) {
    try {
      const { name, code, address, contact_email, contact_phone } = req.body;
      if (!name || !code) {
        return ApiResponse.badRequest(res, 'Name and code are required');
      }
      const college = await collegeService.createCollege({
        name,
        code,
        address,
        contact_email,
        contact_phone
      });
      return ApiResponse.created(res, college, 'College created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateCollege(req, res, next) {
    try {
      const updated = await collegeService.updateCollege(req.params.id, req.body);
      return ApiResponse.success(res, updated, 'College updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Departments
  async getDepartments(req, res, next) {
    try {
      const collegeId = req.query.college_id || req.user.college_id;
      if (!collegeId) {
        return ApiResponse.badRequest(res, 'College ID is required');
      }
      const departments = await collegeService.getDepartments(collegeId);
      return ApiResponse.success(res, departments);
    } catch (error) {
      next(error);
    }
  }

  async createDepartment(req, res, next) {
    try {
      const { college_id, name, code } = req.body;
      const targetCollegeId = college_id || req.user.college_id;
      if (!targetCollegeId || !name || !code) {
        return ApiResponse.badRequest(res, 'college_id, name, and code are required');
      }
      const dept = await collegeService.createDepartment({
        college_id: targetCollegeId,
        name,
        code
      });
      return ApiResponse.created(res, dept, 'Department created successfully');
    } catch (error) {
      next(error);
    }
  }

  // Courses
  async getCourses(req, res, next) {
    try {
      const departmentId = req.query.department_id;
      if (!departmentId) {
        return ApiResponse.badRequest(res, 'department_id query parameter is required');
      }
      const courses = await collegeService.getCourses(departmentId);
      return ApiResponse.success(res, courses);
    } catch (error) {
      next(error);
    }
  }

  async createCourse(req, res, next) {
    try {
      const { department_id, name, code, duration_years } = req.body;
      if (!department_id || !name || !code) {
        return ApiResponse.badRequest(res, 'department_id, name, and code are required');
      }
      const course = await collegeService.createCourse({
        department_id,
        name,
        code,
        duration_years: duration_years || 4
      });
      return ApiResponse.created(res, course, 'Course created successfully');
    } catch (error) {
      next(error);
    }
  }

  // Batches
  async getBatches(req, res, next) {
    try {
      const courseId = req.query.course_id;
      if (!courseId) {
        return ApiResponse.badRequest(res, 'course_id query parameter is required');
      }
      const batches = await collegeService.getBatches(courseId);
      return ApiResponse.success(res, batches);
    } catch (error) {
      next(error);
    }
  }

  async createBatch(req, res, next) {
    try {
      const { course_id, name, start_year, end_year } = req.body;
      if (!course_id || !name || !start_year || !end_year) {
        return ApiResponse.badRequest(res, 'course_id, name, start_year, and end_year are required');
      }
      const batch = await collegeService.createBatch({
        course_id,
        name,
        start_year,
        end_year
      });
      return ApiResponse.created(res, batch, 'Batch created successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CollegeController();
