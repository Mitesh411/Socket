const userService = require('../services/userService');
const ApiResponse = require('../utils/apiResponse');

class UserController {
  async listUsers(req, res, next) {
    try {
      const filter = {};
      // If not super_admin, constrain by user's college
      if (req.user.role.name !== 'super_admin') {
        filter.college_id = req.user.college_id;
      } else if (req.query.college_id) {
        filter.college_id = req.query.college_id;
      }

      if (req.query.role_id) filter.role_id = req.query.role_id;
      if (req.query.search) filter.search = req.query.search;

      const options = {
        limit: parseInt(req.query.limit || '100', 10),
        offset: parseInt(req.query.offset || '0', 10)
      };

      const users = await userService.listUsers(filter, options);
      return ApiResponse.success(res, users);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      return ApiResponse.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { first_name, last_name, phone, avatar_url, is_active } = req.body;
      const updated = await userService.updateUser(req.params.id, {
        first_name,
        last_name,
        phone,
        avatar_url,
        is_active
      });
      return ApiResponse.success(res, updated, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      await userService.deleteUser(req.params.id);
      return ApiResponse.success(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getOnlineUsers(req, res, next) {
    try {
      const collegeId = req.user.role.name === 'super_admin' ? (req.query.college_id || null) : req.user.college_id;
      const onlineUsers = await userService.getOnlineUsers(collegeId);
      return ApiResponse.success(res, onlineUsers);
    } catch (error) {
      next(error);
    }
  }

  async listStudents(req, res, next) {
    try {
      const collegeId = req.user.role.name === 'super_admin' ? req.query.college_id : req.user.college_id;
      const students = await userService.listStudents(
        collegeId,
        req.query.department_id,
        req.query.batch_id
      );
      return ApiResponse.success(res, students);
    } catch (error) {
      next(error);
    }
  }

  async listFaculty(req, res, next) {
    try {
      const collegeId = req.user.role.name === 'super_admin' ? req.query.college_id : req.user.college_id;
      const faculty = await userService.listFaculty(collegeId, req.query.department_id);
      return ApiResponse.success(res, faculty);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
