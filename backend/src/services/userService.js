const userRepository = require('../repositories/userRepository');
const { StudentProfile, FacultyProfile, Role, College, Department, Batch } = require('../models');

class UserService {
  async listUsers(filter, options) {
    return userRepository.findAll(filter, options);
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return user;
  }

  async updateUser(id, data) {
    return userRepository.update(id, data);
  }

  async deleteUser(id) {
    return userRepository.delete(id);
  }

  async getOnlineUsers(collegeId) {
    return userRepository.getOnlineUsers(collegeId);
  }

  // Students list
  async listStudents(collegeId, departmentId = null, batchId = null) {
    const whereProfile = {};
    if (departmentId) whereProfile.department_id = departmentId;
    if (batchId) whereProfile.batch_id = batchId;

    return StudentProfile.findAll({
      where: whereProfile,
      include: [
        {
          model: require('../models').User,
          as: 'user',
          where: collegeId ? { college_id: collegeId } : {},
          attributes: { exclude: ['password_hash'] },
          include: [{ model: Role, as: 'role' }, { model: College, as: 'college' }]
        },
        { model: Department, as: 'department' },
        { model: Batch, as: 'batch' }
      ]
    });
  }

  // Faculty list
  async listFaculty(collegeId, departmentId = null) {
    const whereProfile = {};
    if (departmentId) whereProfile.department_id = departmentId;

    return FacultyProfile.findAll({
      where: whereProfile,
      include: [
        {
          model: require('../models').User,
          as: 'user',
          where: collegeId ? { college_id: collegeId } : {},
          attributes: { exclude: ['password_hash'] },
          include: [{ model: Role, as: 'role' }, { model: College, as: 'college' }]
        },
        { model: Department, as: 'department' }
      ]
    });
  }
}

module.exports = new UserService();
