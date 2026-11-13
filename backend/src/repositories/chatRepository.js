const { ChatRoom, ChatRoomMember, Message, MessageStatus, User, Role } = require('../models');
const { Op } = require('sequelize');

class ChatRepository {
  async findRoomById(roomId) {
    return ChatRoom.findByPk(roomId, {
      include: [
        {
          model: ChatRoomMember,
          as: 'members',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url']
            }
          ]
        }
      ]
    });
  }

  async findRoomsForUser(userId, collegeId) {
    return ChatRoom.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { college_id: collegeId, type: ['college'] },
          { '$members.user_id$': userId }
        ]
      },
      include: [
        {
          model: ChatRoomMember,
          as: 'members',
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url']
            }
          ]
        },
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'first_name', 'last_name']
            }
          ]
        }
      ],
      order: [['updated_at', 'DESC']]
    });
  }

  async findOrCreateDirectRoom(user1Id, user2Id, collegeId) {
    const minId = Math.min(user1Id, user2Id);
    const maxId = Math.max(user1Id, user2Id);
    const roomName = `direct_${minId}_${maxId}`;

    let room = await ChatRoom.findOne({
      where: {
        type: 'direct',
        name: roomName
      },
      include: [{ model: ChatRoomMember, as: 'members' }]
    });

    if (!room) {
      room = await ChatRoom.create({
        college_id: collegeId,
        type: 'direct',
        name: roomName,
        created_by: user1Id,
        is_active: true
      });

      await ChatRoomMember.bulkCreate([
        { chat_room_id: room.id, user_id: user1Id, role: 'member' },
        { chat_room_id: room.id, user_id: user2Id, role: 'member' }
      ]);

      room = await this.findRoomById(room.id);
    }

    return room;
  }

  async createRoom(roomData, memberUserIds = []) {
    const room = await ChatRoom.create(roomData);

    const membersToAdd = Array.from(new Set([roomData.created_by, ...memberUserIds]))
      .filter(Boolean)
      .map((userId) => ({
        chat_room_id: room.id,
        user_id: userId,
        role: userId === roomData.created_by ? 'admin' : 'member'
      }));

    if (membersToAdd.length > 0) {
      await ChatRoomMember.bulkCreate(membersToAdd, { ignoreDuplicates: true });
    }

    return this.findRoomById(room.id);
  }

  async addMember(roomId, userId, role = 'member') {
    return ChatRoomMember.findOrCreate({
      where: { chat_room_id: roomId, user_id: userId },
      defaults: { chat_room_id: roomId, user_id: userId, role }
    });
  }

  async isMember(roomId, userId) {
    const membership = await ChatRoomMember.findOne({
      where: { chat_room_id: roomId, user_id: userId }
    });
    return !!membership;
  }

  async createMessage(data) {
    const message = await Message.create(data);
    // Touch room updated_at
    await ChatRoom.update({ updated_at: new Date() }, { where: { id: data.chat_room_id } });

    // Fetch members to initialize message_status
    const members = await ChatRoomMember.findAll({
      where: { chat_room_id: data.chat_room_id }
    });

    const statuses = members.map((m) => ({
      message_id: message.id,
      user_id: m.user_id,
      status: m.user_id === data.sender_id ? 'read' : 'sent'
    }));

    if (statuses.length > 0) {
      await MessageStatus.bulkCreate(statuses, { ignoreDuplicates: true });
    }

    return this.findMessageById(message.id);
  }

  async findMessageById(id) {
    return Message.findByPk(id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url']
        },
        {
          model: MessageStatus,
          as: 'statuses'
        }
      ]
    });
  }

  async getMessages(roomId, limit = 50, beforeId = null) {
    const where = { chat_room_id: roomId };
    if (beforeId) {
      where.id = { [Op.lt]: beforeId };
    }

    const messages = await Message.findAll({
      where,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url']
        },
        {
          model: MessageStatus,
          as: 'statuses'
        }
      ],
      order: [['created_at', 'DESC']],
      limit
    });

    return messages.reverse(); // Return in chronological order
  }

  async updateDeliveryStatus(messageId, userId, status = 'delivered') {
    const [record] = await MessageStatus.findOrCreate({
      where: { message_id: messageId, user_id: userId },
      defaults: { message_id: messageId, user_id: userId, status }
    });

    if (record && record.status !== 'read') {
      record.status = status;
      await record.save();
    }
    return record;
  }

  async markRoomAsRead(roomId, userId, lastMessageId) {
    await ChatRoomMember.update(
      { last_read_message_id: lastMessageId },
      { where: { chat_room_id: roomId, user_id: userId } }
    );

    // Update message_status for all messages in room up to lastMessageId
    const messages = await Message.findAll({
      where: {
        chat_room_id: roomId,
        id: { [Op.lte]: lastMessageId }
      },
      attributes: ['id']
    });

    const msgIds = messages.map((m) => m.id);
    if (msgIds.length > 0) {
      await MessageStatus.update(
        { status: 'read' },
        {
          where: {
            message_id: msgIds,
            user_id: userId
          }
        }
      );
    }
  }
}

module.exports = new ChatRepository();
