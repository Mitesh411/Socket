const logger = require('../utils/logger');
const roomManager = require('./roomManager');
const userRepository = require('../repositories/userRepository');
const chatService = require('../services/chatService');
const notificationService = require('../services/notificationService');

// Map to track active user socket counts: userId -> Set of socketIds
const onlineUsersTracker = new Map();

const registerSocketEvents = (io, socket) => {
  const user = socket.user;
  const socketId = socket.id;

  logger.info(`Socket connected: ${socketId} (User: ${user.name}, ID: ${user.id}, Role: ${user.role})`);

  // 1. Connection Lifecycle & Online Presence
  (async () => {
    try {
      // Update DB session
      const deviceInfo = socket.handshake.headers['user-agent'] || 'Web Client';
      await userRepository.updateSocketSession(user.id, socketId, true, deviceInfo);

      // Track in memory
      if (!onlineUsersTracker.has(user.id)) {
        onlineUsersTracker.set(user.id, new Set());
      }
      onlineUsersTracker.get(user.id).add(socketId);

      // Join default rooms
      const defaultRooms = await roomManager.getDefaultRoomsForUser(user);
      defaultRooms.forEach((r) => socket.join(r));

      // Broadcast user:online to college room
      if (user.college_id) {
        socket.to(roomManager.getCollegeRoom(user.college_id)).emit('user:online', {
          userId: user.id,
          name: user.name,
          role: user.role,
          avatar_url: user.avatar_url,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      logger.error('Error during socket initialization:', err);
    }
  })();

  // 2. Room Events
  socket.on('room:join', async (data, callback) => {
    try {
      const roomIdentifier = typeof data === 'string' ? data : (data.room || `room:${data.roomId}`);
      const hasAccess = await roomManager.validateRoomAccess(user, roomIdentifier);

      if (!hasAccess) {
        socket.emit('message:error', {
          error: 'Forbidden',
          message: `Access denied to room ${roomIdentifier}`
        });
        if (typeof callback === 'function') callback({ success: false, error: 'Forbidden' });
        return;
      }

      socket.join(roomIdentifier);
      logger.info(`User ${user.id} joined room ${roomIdentifier}`);
      socket.emit('room:joined', { room: roomIdentifier });
      if (typeof callback === 'function') callback({ success: true, room: roomIdentifier });
    } catch (err) {
      logger.error('Error in room:join:', err);
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  socket.on('room:leave', (data) => {
    const roomIdentifier = typeof data === 'string' ? data : (data.room || `room:${data.roomId}`);
    socket.leave(roomIdentifier);
    logger.info(`User ${user.id} left room ${roomIdentifier}`);
  });

  // 3. Messaging Events
  socket.on('message:send', async (data, callback) => {
    try {
      const { roomId, content, messageType, mediaUrl, parentMessageId, clientMsgId } = data;

      if (!roomId || !content || !content.trim()) {
        const errorPayload = { error: 'Validation', message: 'roomId and non-empty content required' };
        socket.emit('message:error', errorPayload);
        if (typeof callback === 'function') callback({ success: false, ...errorPayload });
        return;
      }

      const roomKey = roomManager.getChatRoom(roomId);
      const hasAccess = await roomManager.validateRoomAccess(user, roomKey);
      if (!hasAccess) {
        const errorPayload = { error: 'Forbidden', message: 'Not authorized to send messages to this room' };
        socket.emit('message:error', errorPayload);
        if (typeof callback === 'function') callback({ success: false, ...errorPayload });
        return;
      }

      // Save message in DB
      const message = await chatService.sendMessage(
        user.id,
        parseInt(roomId, 10),
        content.trim(),
        messageType || 'text',
        mediaUrl || null,
        parentMessageId || null
      );

      const messagePayload = {
        id: message.id,
        roomId: parseInt(roomId, 10),
        senderId: user.id,
        sender: {
          id: user.id,
          name: user.name,
          avatar_url: user.avatar_url,
          role: user.role
        },
        content: message.content,
        messageType: message.message_type,
        mediaUrl: message.media_url,
        parentMessageId: message.parent_message_id,
        clientMsgId: clientMsgId || null,
        createdAt: message.created_at,
        status: 'sent'
      };

      // Broadcast to all sockets in the chat room (including sender)
      io.to(roomKey).emit('message:received', messagePayload);

      // Acknowledge sender
      if (typeof callback === 'function') {
        callback({ success: true, message: messagePayload });
      }
    } catch (err) {
      logger.error('Error handling message:send:', err);
      socket.emit('message:error', { error: 'Server', message: err.message });
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  socket.on('message:delivered', async (data) => {
    try {
      const { messageId, senderId, roomId } = data;
      if (!messageId) return;

      await chatService.updateDeliveryStatus(messageId, user.id, 'delivered');

      if (senderId) {
        io.to(roomManager.getUserRoom(senderId)).emit('message:delivered', {
          messageId,
          userId: user.id,
          roomId,
          status: 'delivered'
        });
      }
    } catch (err) {
      logger.error('Error in message:delivered event:', err);
    }
  });

  socket.on('message:read', async (data) => {
    try {
      const { messageId, roomId, senderId } = data;
      if (!roomId || !messageId) return;

      await chatService.markRoomAsRead(roomId, user.id, messageId);

      const payload = {
        messageId,
        userId: user.id,
        roomId,
        status: 'read'
      };

      // Notify room members that messages up to messageId were read by this user
      io.to(roomManager.getChatRoom(roomId)).emit('message:read', payload);
      if (senderId) {
        io.to(roomManager.getUserRoom(senderId)).emit('message:read', payload);
      }
    } catch (err) {
      logger.error('Error in message:read event:', err);
    }
  });

  // 4. Notification Events
  socket.on('notification:send', async (data, callback) => {
    try {
      // Role check: Only faculty and admins can emit broadcast notifications
      if (!['super_admin', 'college_admin', 'faculty'].includes(user.role)) {
        const errorPayload = { error: 'Forbidden', message: 'Insufficient role to send notifications' };
        socket.emit('message:error', errorPayload);
        if (typeof callback === 'function') callback({ success: false, ...errorPayload });
        return;
      }

      const { title, content, type, priority, targetRole, targetUserId } = data;
      const result = await notificationService.sendNotification(user.id, user.college_id, {
        title,
        content,
        type: type || 'college',
        priority: priority || 'normal',
        target_role: targetRole,
        target_user_id: targetUserId
      });

      const notifPayload = {
        id: result.notification.id,
        title: result.notification.title,
        content: result.notification.content,
        type: result.notification.type,
        priority: result.notification.priority,
        sender: {
          id: user.id,
          name: user.name,
          role: user.role
        },
        createdAt: result.notification.created_at
      };

      // Broadcast to target recipients
      if (targetUserId) {
        io.to(roomManager.getUserRoom(targetUserId)).emit('notification:received', notifPayload);
      } else {
        io.to(roomManager.getCollegeRoom(user.college_id)).emit('notification:received', notifPayload);
      }

      if (typeof callback === 'function') callback({ success: true, notification: notifPayload });
    } catch (err) {
      logger.error('Error in notification:send:', err);
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  socket.on('notification:read', async (data) => {
    try {
      const { notificationId } = data;
      if (notificationId) {
        await notificationService.markAsRead(notificationId, user.id);
      }
    } catch (err) {
      logger.error('Error in notification:read:', err);
    }
  });

  // 5. Presence & Typing Events
  socket.on('user:typing', (data) => {
    const { roomId } = data;
    if (!roomId) return;
    socket.to(roomManager.getChatRoom(roomId)).emit('user:typing', {
      roomId,
      userId: user.id,
      name: user.name
    });
  });

  socket.on('user:stop_typing', (data) => {
    const { roomId } = data;
    if (!roomId) return;
    socket.to(roomManager.getChatRoom(roomId)).emit('user:stop_typing', {
      roomId,
      userId: user.id
    });
  });

  socket.on('users:online', async (data, callback) => {
    try {
      const onlineUsers = await userRepository.getOnlineUsers(user.college_id);
      socket.emit('users:online', onlineUsers);
      if (typeof callback === 'function') callback({ success: true, users: onlineUsers });
    } catch (err) {
      logger.error('Error fetching online users in socket event:', err);
    }
  });

  // 6. Disconnection Handling
  socket.on('disconnect', async (reason) => {
    logger.info(`Socket disconnected: ${socketId} (User: ${user.name}, Reason: ${reason})`);

    try {
      // Mark socket session offline in DB
      await userRepository.markSocketDisconnected(socketId);

      // Update in-memory tracker
      if (onlineUsersTracker.has(user.id)) {
        const sockets = onlineUsersTracker.get(user.id);
        sockets.delete(socketId);

        // If no more active sockets for this user, broadcast offline event
        if (sockets.size === 0) {
          onlineUsersTracker.delete(user.id);
          if (user.college_id) {
            socket.to(roomManager.getCollegeRoom(user.college_id)).emit('user:offline', {
              userId: user.id,
              name: user.name,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    } catch (err) {
      logger.error('Error handling socket disconnect:', err);
    }
  });
};

module.exports = {
  registerSocketEvents,
  onlineUsersTracker
};
