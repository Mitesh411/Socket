const { User, Role, College, StudentProfile, FacultyProfile, SocketSession } = require('../models');
const { Op } = require('sequelize');

class UserRepository {
  async findByEmail(email) {
    return User.findOne({
      where: { email },
      include: [
        { model: Role, as: 'role' },
        { model: College, as: 'college' },
        { model: StudentProfile, as: 'student_profile' },
        { model: FacultyProfile, as: 'faculty_profile' }
      ]
    });
  }

  async findById(id) {
    return User.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Role, as: 'role' },
        { model: College, as: 'college' },
        { model: StudentProfile, as: 'student_profile' },
        { model: FacultyProfile, as: 'faculty_profile' }
      ]
    });
  }

  async create(userData) {
    return User.create(userData);
  }

  async update(id, updateData) {
    await User.update(updateData, { where: { id } });
    return this.findById(id);
  }

  async delete(id) {
    return User.destroy({ where: { id } });
  }

  async findAll(filter = {}, options = {}) {
    const where = {};
    if (filter.college_id) where.college_id = filter.college_id;
    if (filter.role_id) where.role_id = filter.role_id;
    if (filter.is_active !== undefined) where.is_active = filter.is_active;
    if (filter.search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${filter.search}%` } },
        { last_name: { [Op.like]: `%${filter.search}%` } },
        { email: { [Op.like]: `%${filter.search}%` } }
      ];
    }

    return User.findAll({
      where,
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Role, as: 'role' },
        { model: College, as: 'college' }
      ],
      limit: options.limit || 100,
      offset: options.offset || 0,
      order: [['created_at', 'DESC']]
    });
  }

  async updateSocketSession(userId, socketId, isOnline, deviceInfo = null) {
    const existing = await SocketSession.findOne({ where: { socket_id: socketId } });
    if (existing) {
      existing.is_online = isOnline;
      existing.last_seen = new Date();
      if (deviceInfo) existing.device_info = deviceInfo;
      await existing.save();
      return existing;
    }

    return SocketSession.create({
      user_id: userId,
      socket_id: socketId,
      device_info: deviceInfo,
      is_online: isOnline,
      last_seen: new Date()
    });
  }

  async markSocketDisconnected(socketId) {
    const session = await SocketSession.findOne({ where: { socket_id: socketId } });
    if (session) {
      session.is_online = false;
      session.last_seen = new Date();
      await session.save();
    }
    return session;
  }

  async getOnlineUsers(collegeId = null) {
    const whereUser = { is_active: true };
    if (collegeId) whereUser.college_id = collegeId;

    const sessions = await SocketSession.findAll({
      where: { is_online: true },
      include: [
        {
          model: User,
          as: 'user',
          where: whereUser,
          attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url', 'college_id'],
          include: [{ model: Role, as: 'role', attributes: ['name'] }]
        }
      ]
    });

    const uniqueUsersMap = new Map();
    sessions.forEach((s) => {
      if (s.user && !uniqueUsersMap.has(s.user.id)) {
        uniqueUsersMap.set(s.user.id, s.user);
      }
    });

    return Array.from(uniqueUsersMap.values());
  }
}

module.exports = new UserRepository();
