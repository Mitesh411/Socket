const notificationService = require('../services/notificationService');
const ApiResponse = require('../utils/apiResponse');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const limit = parseInt(req.query.limit || '50', 10);
      const onlyUnread = req.query.unread === 'true';
      const notifications = await notificationService.getUserNotifications(
        req.user.id,
        limit,
        onlyUnread
      );
      const unreadCount = await notificationService.getUnreadCount(req.user.id);

      return ApiResponse.success(res, {
        notifications,
        unreadCount
      });
    } catch (error) {
      next(error);
    }
  }

  async sendNotification(req, res, next) {
    try {
      const { title, content, type, priority, target_role, target_user_id, reference_type, reference_id } = req.body;
      if (!title || !content) {
        return ApiResponse.badRequest(res, 'Title and content are required');
      }

      const result = await notificationService.sendNotification(
        req.user.id,
        req.user.college_id,
        {
          title,
          content,
          type,
          priority,
          target_role,
          target_user_id,
          reference_type,
          reference_id
        }
      );

      return ApiResponse.created(res, result.notification, 'Notification sent successfully');
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      await notificationService.markAsRead(req.params.id, req.user.id);
      return ApiResponse.success(res, null, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user.id);
      return ApiResponse.success(res, null, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  // Announcements
  async getAnnouncements(req, res, next) {
    try {
      const collegeId = req.user.college_id;
      const announcements = await notificationService.getAnnouncements(
        collegeId,
        req.query.department_id,
        req.user.role.name
      );
      return ApiResponse.success(res, announcements);
    } catch (error) {
      next(error);
    }
  }

  async createAnnouncement(req, res, next) {
    try {
      const { title, content, target_role, priority, department_id, course_id, batch_id, expires_at } = req.body;
      if (!title || !content) {
        return ApiResponse.badRequest(res, 'Title and content are required');
      }

      const announcement = await notificationService.createAnnouncement(
        req.user.id,
        req.user.college_id,
        {
          title,
          content,
          target_role,
          priority,
          department_id,
          course_id,
          batch_id,
          expires_at
        }
      );

      return ApiResponse.created(res, announcement, 'Announcement posted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
