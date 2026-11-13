const { Notification, UserNotification, Announcement, User, Role, Department, Course, Batch } = require('../models');

class NotificationRepository {
  async createNotification(notifData, targetUserIds = []) {
    const notification = await Notification.create(notifData);

    if (targetUserIds.length > 0) {
      const records = targetUserIds.map((userId) => ({
        notification_id: notification.id,
        user_id: userId,
        is_read: false
      }));
      await UserNotification.bulkCreate(records, { ignoreDuplicates: true });
    }

    return this.findNotificationById(notification.id);
  }

  async findNotificationById(id) {
    return Notification.findByPk(id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });
  }

  async getUserNotifications(userId, limit = 50, onlyUnread = false) {
    const where = { user_id: userId };
    if (onlyUnread) {
      where.is_read = false;
    }

    return UserNotification.findAll({
      where,
      include: [
        {
          model: Notification,
          as: 'notification',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'first_name', 'last_name', 'email']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit
    });
  }

  async getUnreadCount(userId) {
    return UserNotification.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });
  }

  async markAsRead(notificationId, userId) {
    const [updated] = await UserNotification.update(
      { is_read: true, read_at: new Date() },
      { where: { notification_id: notificationId, user_id: userId } }
    );
    return updated > 0;
  }

  async markAllAsRead(userId) {
    const [updated] = await UserNotification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: userId, is_read: false } }
    );
    return updated;
  }

  // Announcements
  async createAnnouncement(data) {
    return Announcement.create(data);
  }

  async getAnnouncements(collegeId, departmentId = null, roleName = 'all', limit = 20) {
    const where = { college_id: collegeId };
    return Announcement.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['created_at', 'DESC']],
      limit
    });
  }
}

module.exports = new NotificationRepository();
