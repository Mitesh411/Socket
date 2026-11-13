const collegeRepository = require('../repositories/collegeRepository');

class CollegeService {
  async getAllColleges() {
    return collegeRepository.findAllColleges();
  }

  async getCollegeById(id) {
    const college = await collegeRepository.findCollegeById(id);
    if (!college) {
      const err = new Error('College not found');
      err.statusCode = 404;
      throw err;
    }
    return college;
  }

  async createCollege(data) {
    return collegeRepository.createCollege(data);
  }

  async updateCollege(id, data) {
    return collegeRepository.updateCollege(id, data);
  }

  async getDepartments(collegeId) {
    return collegeRepository.findDepartmentsByCollege(collegeId);
  }

  async createDepartment(data) {
    return collegeRepository.createDepartment(data);
  }

  async getCourses(departmentId) {
    return collegeRepository.findCoursesByDepartment(departmentId);
  }

  async createCourse(data) {
    return collegeRepository.createCourse(data);
  }

  async getBatches(courseId) {
    return collegeRepository.findBatchesByCourse(courseId);
  }

  async createBatch(data) {
    return collegeRepository.createBatch(data);
  }
}

module.exports = new CollegeService();
