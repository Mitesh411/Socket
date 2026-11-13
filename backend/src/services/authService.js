const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const { generateToken } = require('../utils/jwtHelper');
const { Role, College, StudentProfile, FacultyProfile } = require('../models');

class AuthService {
  async register(data) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Default role: 4 (student) if not specified
    const roleId = data.role_id || 4;

    const user = await userRepository.create({
      college_id: data.college_id || null,
      role_id: roleId,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password_hash: passwordHash,
      phone: data.phone || null,
      avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.first_name}`
    });

    // Create student or faculty profile if fields passed
    if (roleId === 4 && data.enrollment_no && data.batch_id && data.department_id) {
      await StudentProfile.create({
        user_id: user.id,
        enrollment_no: data.enrollment_no,
        batch_id: data.batch_id,
        department_id: data.department_id,
        semester: data.semester || 1
      });
    } else if (roleId === 3 && data.employee_id && data.department_id) {
      await FacultyProfile.create({
        user_id: user.id,
        employee_id: data.employee_id,
        department_id: data.department_id,
        designation: data.designation || 'Lecturer',
        qualification: data.qualification || null
      });
    }

    const fullUser = await userRepository.findById(user.id);
    const token = generateToken({
      id: fullUser.id,
      email: fullUser.email,
      role: fullUser.role ? fullUser.role.name : null,
      college_id: fullUser.college_id
    });

    return { user: fullUser, token };
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    if (!user.is_active) {
      const err = new Error('Account has been deactivated. Contact your college administrator.');
      err.statusCode = 403;
      throw err;
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role ? user.role.name : null,
      college_id: user.college_id
    });

    // Strip password_hash
    const userJson = user.toJSON();
    delete userJson.password_hash;

    return { user: userJson, token };
  }

  async getMe(userId) {
    return userRepository.findById(userId);
  }
}

module.exports = new AuthService();
