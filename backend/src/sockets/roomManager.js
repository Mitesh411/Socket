const logger = require('../utils/logger');
const { ChatRoom, ChatRoomMember } = require('../models');

class RoomManager {
  getUserRoom(userId) {
    return `user:${userId}`;
  }

  getCollegeRoom(collegeId) {
    return `college:${collegeId}`;
  }

  getDepartmentRoom(departmentId) {
    return `department:${departmentId}`;
  }

  getBatchRoom(batchId) {
    return `batch:${batchId}`;
  }

  getChatRoom(roomId) {
    return `room:${roomId}`;
  }

  async getDefaultRoomsForUser(user) {
    const rooms = [this.getUserRoom(user.id)];

    if (user.college_id) {
      rooms.push(this.getCollegeRoom(user.college_id));
    }

    if (user.department_id) {
      rooms.push(this.getDepartmentRoom(user.department_id));
    }

    if (user.batch_id) {
      rooms.push(this.getBatchRoom(user.batch_id));
    }

    // Also fetch chat rooms the user is an active member of
    try {
      const memberships = await ChatRoomMember.findAll({
        where: { user_id: user.id },
        attributes: ['chat_room_id']
      });
      memberships.forEach((m) => {
        rooms.push(this.getChatRoom(m.chat_room_id));
      });
    } catch (e) {
      logger.error('Error fetching memberships for user rooms:', e);
    }

    return rooms;
  }

  async validateRoomAccess(user, roomIdentifier) {
    if (user.role === 'super_admin') return true;

    // College room validation
    if (roomIdentifier.startsWith('college:')) {
      const collegeId = parseInt(roomIdentifier.split(':')[1], 10);
      return user.college_id === collegeId;
    }

    // Department room validation
    if (roomIdentifier.startsWith('department:')) {
      const deptId = parseInt(roomIdentifier.split(':')[1], 10);
      return user.department_id === deptId;
    }

    // Batch room validation
    if (roomIdentifier.startsWith('batch:')) {
      const batchId = parseInt(roomIdentifier.split(':')[1], 10);
      return user.batch_id === batchId;
    }

    // Direct / Group Chat Room validation
    if (roomIdentifier.startsWith('room:')) {
      const roomId = parseInt(roomIdentifier.split(':')[1], 10);
      const room = await ChatRoom.findByPk(roomId);
      if (!room) return false;

      // College-wide rooms in user's college are public
      if (room.type === 'college' && room.college_id === user.college_id) {
        return true;
      }

      // Department rooms in user's department
      if (room.type === 'department' && room.reference_id === user.department_id) {
        return true;
      }

      // Batch rooms in user's batch
      if (room.type === 'batch' && room.reference_id === user.batch_id) {
        return true;
      }

      // Direct or private group: check membership
      const membership = await ChatRoomMember.findOne({
        where: { chat_room_id: roomId, user_id: user.id }
      });
      return !!membership;
    }

    // User private room
    if (roomIdentifier.startsWith('user:')) {
      const userId = parseInt(roomIdentifier.split(':')[1], 10);
      return user.id === userId;
    }

    return false;
  }
}

module.exports = new RoomManager();
