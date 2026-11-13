const chatService = require('../services/chatService');
const ApiResponse = require('../utils/apiResponse');

class ChatController {
  async getRooms(req, res, next) {
    try {
      const rooms = await chatService.getRoomsForUser(req.user.id, req.user.college_id);
      return ApiResponse.success(res, rooms);
    } catch (error) {
      next(error);
    }
  }

  async getRoomById(req, res, next) {
    try {
      const room = await chatService.getRoomById(req.params.id, req.user.id);
      return ApiResponse.success(res, room);
    } catch (error) {
      next(error);
    }
  }

  async createGroupRoom(req, res, next) {
    try {
      const { name, member_ids } = req.body;
      if (!name) {
        return ApiResponse.badRequest(res, 'Group room name is required');
      }
      const room = await chatService.createGroupRoom(
        name,
        req.user.id,
        req.user.college_id,
        member_ids || []
      );
      return ApiResponse.created(res, room, 'Group chat created');
    } catch (error) {
      next(error);
    }
  }

  async getOrCreateDirectChat(req, res, next) {
    try {
      const { recipient_id } = req.body;
      if (!recipient_id) {
        return ApiResponse.badRequest(res, 'recipient_id is required');
      }
      const room = await chatService.getOrCreateDirectChat(
        req.user.id,
        parseInt(recipient_id, 10),
        req.user.college_id
      );
      return ApiResponse.success(res, room, 'Direct chat initialized');
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const limit = parseInt(req.query.limit || '50', 10);
      const beforeId = req.query.before_id ? parseInt(req.query.before_id, 10) : null;
      const messages = await chatService.getRoomMessages(req.params.id, req.user.id, limit, beforeId);
      return ApiResponse.success(res, messages);
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const { content, message_type, media_url, parent_message_id } = req.body;
      if (!content || !content.trim()) {
        return ApiResponse.badRequest(res, 'Message content cannot be empty');
      }

      const message = await chatService.sendMessage(
        req.user.id,
        parseInt(req.params.id, 10),
        content.trim(),
        message_type || 'text',
        media_url || null,
        parent_message_id || null
      );

      return ApiResponse.created(res, message, 'Message sent successfully');
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { last_message_id } = req.body;
      if (!last_message_id) {
        return ApiResponse.badRequest(res, 'last_message_id is required');
      }
      await chatService.markRoomAsRead(req.params.id, req.user.id, last_message_id);
      return ApiResponse.success(res, null, 'Marked as read');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
