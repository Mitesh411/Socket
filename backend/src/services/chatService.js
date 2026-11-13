const chatRepository = require('../repositories/chatRepository');
const userRepository = require('../repositories/userRepository');

class ChatService {
  async getRoomsForUser(userId, collegeId) {
    return chatRepository.findRoomsForUser(userId, collegeId);
  }

  async getRoomById(roomId, userId) {
    const room = await chatRepository.findRoomById(roomId);
    if (!room) {
      const err = new Error('Chat room not found');
      err.statusCode = 404;
      throw err;
    }

    // Permission check: if private group or direct, ensure user is member
    if (room.type === 'direct' || room.type === 'group') {
      const isMember = room.members && room.members.some((m) => m.user_id === userId);
      if (!isMember) {
        const err = new Error('Not authorized to access this chat room');
        err.statusCode = 403;
        throw err;
      }
    }
    return room;
  }

  async createGroupRoom(name, creatorId, collegeId, memberIds = []) {
    return chatRepository.createRoom(
      {
        name,
        type: 'group',
        created_by: creatorId,
        college_id: collegeId,
        is_active: true
      },
      memberIds
    );
  }

  async getOrCreateDirectChat(user1Id, user2Id, collegeId) {
    const targetUser = await userRepository.findById(user2Id);
    if (!targetUser) {
      const err = new Error('Recipient user not found');
      err.statusCode = 404;
      throw err;
    }
    return chatRepository.findOrCreateDirectRoom(user1Id, user2Id, collegeId);
  }

  async sendMessage(senderId, roomId, content, messageType = 'text', mediaUrl = null, parentMessageId = null) {
    const room = await chatRepository.findRoomById(roomId);
    if (!room) {
      const err = new Error('Chat room not found');
      err.statusCode = 404;
      throw err;
    }

    // If direct or group room, make sure sender is member
    if (room.type === 'direct' || room.type === 'group') {
      const isMember = await chatRepository.isMember(roomId, senderId);
      if (!isMember) {
        const err = new Error('You are not a participant in this conversation');
        err.statusCode = 403;
        throw err;
      }
    }

    const message = await chatRepository.createMessage({
      chat_room_id: roomId,
      sender_id: senderId,
      content,
      message_type: messageType,
      media_url: mediaUrl,
      parent_message_id: parentMessageId
    });

    return message;
  }

  async getRoomMessages(roomId, userId, limit = 50, beforeId = null) {
    // Validate membership
    await this.getRoomById(roomId, userId);
    return chatRepository.getMessages(roomId, limit, beforeId);
  }

  async markRoomAsRead(roomId, userId, lastMessageId) {
    return chatRepository.markRoomAsRead(roomId, userId, lastMessageId);
  }

  async updateDeliveryStatus(messageId, userId, status) {
    return chatRepository.updateDeliveryStatus(messageId, userId, status);
  }
}

module.exports = new ChatService();
