const authService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');

class AuthController {
  async register(req, res, next) {
    try {
      const { first_name, last_name, email, password, role_id, college_id, phone, enrollment_no, batch_id, department_id, employee_id, designation } = req.body;

      if (!first_name || !last_name || !email || !password) {
        return ApiResponse.badRequest(res, 'First name, last name, email, and password are required');
      }

      const result = await authService.register({
        first_name,
        last_name,
        email,
        password,
        role_id: role_id ? parseInt(role_id, 10) : 4,
        college_id: college_id ? parseInt(college_id, 10) : null,
        phone,
        enrollment_no,
        batch_id: batch_id ? parseInt(batch_id, 10) : null,
        department_id: department_id ? parseInt(department_id, 10) : null,
        employee_id,
        designation
      });

      return ApiResponse.created(res, result, 'Registration successful');
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return ApiResponse.badRequest(res, 'Email and password are required');
      }

      const result = await authService.login(email, password);
      return ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id);
      return ApiResponse.success(res, user, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      // In JWT stateless auth, client discards token and closes socket
      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
