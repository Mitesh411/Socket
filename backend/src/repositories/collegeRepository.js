const { College, Department, Course, Batch, User } = require('../models');

class CollegeRepository {
  async findAllColleges() {
    return College.findAll({
      order: [['name', 'ASC']]
    });
  }

  async findCollegeById(id) {
    return College.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'departments',
          include: [
            {
              model: Course,
              as: 'courses',
              include: [{ model: Batch, as: 'batches' }]
            }
          ]
        }
      ]
    });
  }

  async createCollege(data) {
    return College.create(data);
  }

  async updateCollege(id, data) {
    await College.update(data, { where: { id } });
    return this.findCollegeById(id);
  }

  // Departments
  async findDepartmentsByCollege(collegeId) {
    return Department.findAll({
      where: { college_id: collegeId },
      include: [
        {
          model: Course,
          as: 'courses',
          include: [{ model: Batch, as: 'batches' }]
        }
      ],
      order: [['name', 'ASC']]
    });
  }

  async createDepartment(data) {
    return Department.create(data);
  }

  // Courses
  async findCoursesByDepartment(departmentId) {
    return Course.findAll({
      where: { department_id: departmentId },
      include: [{ model: Batch, as: 'batches' }],
      order: [['name', 'ASC']]
    });
  }

  async createCourse(data) {
    return Course.create(data);
  }

  // Batches
  async findBatchesByCourse(courseId) {
    return Batch.findAll({
      where: { course_id: courseId },
      order: [['start_year', 'DESC']]
    });
  }

  async createBatch(data) {
    return Batch.create(data);
  }
}

module.exports = new CollegeRepository();
