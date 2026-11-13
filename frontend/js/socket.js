/**
 * Real-Time Socket.IO Client Wrapper
 */
const SocketClient = (() => {
  let socket = null;
  let activeRoomId = null;
  let typingTimeout = null;

  const init = () => {
    const token = Auth.getToken();
    if (!token) return;

    if (socket && socket.connected) {
      return;
    }

    UI.updateConnectionStatus('connecting');

    // Create Socket.IO connection
    socket = io(Config.SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected successfully, ID:', socket.id);
      UI.updateConnectionStatus('connected');
      UI.showToast('Connected', 'Real-time communication channel established', 'success');

      // Request online users list
      socket.emit('users:online');

      // Re-join active room if any
      if (activeRoomId) {
        joinRoom(activeRoomId);
      }
    });

    socket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
      UI.updateConnectionStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      UI.updateConnectionStatus('disconnected');
      if (error.message.includes('Authentication') || error.message.includes('Token')) {
        UI.showToast('Authentication Error', 'Session expired, please login again.', 'danger');
      }
    });

    // --- Message Events ---
    socket.on('message:received', (message) => {
      console.log('Received real-time message:', message);
      const isCurrentRoom = activeRoomId && parseInt(activeRoomId, 10) === parseInt(message.roomId, 10);

      if (isCurrentRoom) {
        UI.appendMessageToChat(message);
        // Automatically send delivery and read receipt if not from self
        const currentUser = Auth.getUser();
        if (currentUser && currentUser.id !== message.senderId) {
          socket.emit('message:read', {
            messageId: message.id,
            roomId: message.roomId,
            senderId: message.senderId
          });
        }
      } else {
        // Increment unread badge for room in channel list
        UI.incrementRoomUnread(message.roomId);
        UI.showToast(`New message from ${message.sender?.name || 'User'}`, message.content, 'info');
      }
    });

    socket.on('message:delivered', (data) => {
      UI.updateMessageStatus(data.messageId, 'delivered');
    });

    socket.on('message:read', (data) => {
      UI.updateMessageStatus(data.messageId, 'read');
    });

    socket.on('message:error', (err) => {
      UI.showToast('Chat Error', err.message || 'Error sending message', 'danger');
    });

    // --- Presence Events ---
    socket.on('user:online', (data) => {
      UI.setUserOnline(data.userId, true);
      UI.showToast('User Online', `${data.name} is now online`, 'info');
    });

    socket.on('user:offline', (data) => {
      UI.setUserOnline(data.userId, false);
    });

    socket.on('users:online', (usersList) => {
      UI.renderOnlineUsers(usersList);
    });

    socket.on('user:typing', (data) => {
      if (activeRoomId && parseInt(activeRoomId, 10) === parseInt(data.roomId, 10)) {
        UI.showTypingIndicator(`${data.name} is typing...`);
      }
    });

    socket.on('user:stop_typing', (data) => {
      if (activeRoomId && parseInt(activeRoomId, 10) === parseInt(data.roomId, 10)) {
        UI.hideTypingIndicator();
      }
    });

    // --- Notification Events ---
    socket.on('notification:received', (notification) => {
      UI.addNotification(notification);
      UI.showToast(notification.title, notification.content, 'warning');
    });
  };

  const joinRoom = (roomId) => {
    activeRoomId = roomId;
    if (socket && socket.connected) {
      socket.emit('room:join', { roomId });
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && socket.connected) {
      socket.emit('room:leave', { roomId });
    }
    if (activeRoomId === roomId) {
      activeRoomId = null;
    }
  };

  const sendMessage = (roomId, content, messageType = 'text') => {
    if (!socket || !socket.connected) {
      throw new Error('Socket is disconnected. Please check your connection.');
    }
    const clientMsgId = 'c_' + Date.now();
    socket.emit('message:send', {
      roomId: parseInt(roomId, 10),
      content,
      messageType,
      clientMsgId
    });
  };

  const sendTyping = (roomId) => {
    if (socket && socket.connected) {
      socket.emit('user:typing', { roomId });
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit('user:stop_typing', { roomId });
      }, 2500);
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      activeRoomId = null;
    }
  };

  return {
    init,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    disconnect,
    getSocket: () => socket
  };
})();
