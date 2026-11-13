const notificationRepository = require('../repositories/notificationRepository');
const userRepository = require('../repositories/userRepository');
const { User, StudentProfile, FacultyProfile } = require('../models');

class NotificationService {
  async sendNotification(senderId, collegeId, data) {
    let targetUserIds = [];

    if (data.target_user_id) {
      targetUserIds = [data.target_user_id];
    } else if (data.target_role === 'student') {
      const students = await User.findAll({
        where: { college_id: collegeId, role_id: 4, is_active: true },
        attributes: ['id']
      });
      targetUserIds = students.map((s) => s.id);
    } else if (data.target_role === 'faculty') {
      const faculty = await User.findAll({
        where: { college_id: collegeId, role_id: 3, is_active: true },
        attributes: ['id']
      });
      targetUserIds = faculty.map((f) => f.id);
    } else {
      // All users in the college
      const users = await User.findAll({
        where: { college_id: collegeId, is_active: true },
        attributes: ['id']
      });
      targetUserIds = users.map((u) => u.id);
    }

    const notification = await notificationRepository.createNotification(
      {
        college_id: collegeId,
        sender_id: senderId,
        title: data.title,
        content: data.content,
        type: data.type || 'college',
        priority: data.priority || 'normal',
        reference_type: data.reference_type || null,
        reference_id: data.reference_id || null
      },
      targetUserIds
    );

    return { notification, targetUserIds };
  }

  async getUserNotifications(userId, limit, onlyUnread) {
    return notificationRepository.getUserNotifications(userId, limit, onlyUnread);
  }

  async getUnreadCount(userId) {
    return notificationRepository.getUnreadCount(userId);
  }

  async markAsRead(notificationId, userId) {
    return notificationRepository.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId) {
    return notificationRepository.markAllAsRead(userId);
  }

  // Announcements
  async createAnnouncement(creatorId, collegeId, data) {
    return notificationRepository.createAnnouncement({
      college_id: collegeId,
      department_id: data.department_id || null,
      course_id: data.course_id || null,
      batch_id: data.batch_id || null,
      created_by: creatorId,
      title: data.title,
      content: data.content,
      target_role: data.target_role || 'all',
      priority: data.priority || 'normal',
      expires_at: data.expires_at || null
    });
  }

  async getAnnouncements(collegeId, departmentId, roleName) {
    return notificationRepository.getAnnouncements(collegeId, departmentId, roleName);
  }
}

module.exports = new NotificationService();
