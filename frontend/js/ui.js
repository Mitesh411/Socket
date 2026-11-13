/**
 * UI Renderer & DOM Manager
 */
const UI = (() => {
  const elements = {};

  const init = () => {
    elements.connBadge = document.getElementById('connectionStatusBadge');
    elements.connText = document.getElementById('connectionStatusText');
    elements.toastContainer = document.getElementById('toastContainer');
    elements.chatMessages = document.getElementById('chatMessages');
    elements.chatRoomList = document.getElementById('chatRoomList');
    elements.currentRoomTitle = document.getElementById('currentRoomTitle');
    elements.currentRoomSubtitle = document.getElementById('currentRoomSubtitle');
    elements.typingIndicator = document.getElementById('typingIndicator');
    elements.onlineCountBadge = document.getElementById('onlineCountBadge');
    elements.notifCountBadge = document.getElementById('notifCountBadge');
    elements.notifDropdownList = document.getElementById('notifDropdownList');
  };

  const updateConnectionStatus = (status) => {
    if (!elements.connBadge) return;
    elements.connBadge.className = `connection-badge ${status}`;
    const dot = elements.connBadge.querySelector('.status-dot');

    if (status === 'connected') {
      elements.connText.textContent = 'Live Connected';
      if (dot) dot.className = 'status-dot online';
    } else if (status === 'connecting') {
      elements.connText.textContent = 'Connecting...';
      if (dot) dot.className = 'status-dot online pulsing';
    } else {
      elements.connText.textContent = 'Disconnected';
      if (dot) dot.className = 'status-dot offline';
    }
  };

  const showToast = (title, message, type = 'info') => {
    const container = elements.toastContainer || document.getElementById('toastContainer');
    if (!container) return;

    const id = 'toast_' + Date.now();
    const bgClass = type === 'danger' ? 'bg-danger text-white' : (type === 'warning' ? 'bg-warning text-dark' : (type === 'success' ? 'bg-success text-white' : 'bg-primary text-white'));

    const toastHtml = `
      <div id="${id}" class="toast align-items-center shadow-lg border-0 mb-2" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="4000">
        <div class="toast-header ${bgClass}">
          <strong class="me-auto"><i class="fas fa-bell me-1"></i> ${escapeHtml(title)}</strong>
          <small class="text-white-50">Just now</small>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body bg-white text-dark">
          ${escapeHtml(message)}
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastElem = document.getElementById(id);
    if (window.bootstrap && window.bootstrap.Toast) {
      const bsToast = new bootstrap.Toast(toastElem);
      bsToast.show();
      toastElem.addEventListener('hidden.bs.toast', () => toastElem.remove());
    } else {
      setTimeout(() => toastElem.remove(), 4000);
    }
  };

  const escapeHtml = (unsafe) => {
    if (!unsafe) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const renderRoomsList = (rooms, activeRoomId, onRoomSelect) => {
    if (!elements.chatRoomList) return;
    elements.chatRoomList.innerHTML = '';

    if (!rooms || rooms.length === 0) {
      elements.chatRoomList.innerHTML = '<div class="p-3 text-muted text-center small">No rooms available</div>';
      return;
    }

    rooms.forEach((room) => {
      const isActive = activeRoomId && parseInt(activeRoomId, 10) === parseInt(room.id, 10);
      const div = document.createElement('div');
      div.className = `chat-room-item ${isActive ? 'active' : ''}`;
      div.dataset.roomId = room.id;

      let icon = 'fa-comments text-primary';
      if (room.type === 'college') icon = 'fa-university text-danger';
      else if (room.type === 'department') icon = 'fa-building text-info';
      else if (room.type === 'batch') icon = 'fa-graduation-cap text-success';
      else if (room.type === 'direct') icon = 'fa-user text-warning';

      // Last message snippet
      let snippet = 'No messages yet';
      if (room.messages && room.messages.length > 0) {
        snippet = room.messages[0].content;
      }

      div.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2 text-truncate">
            <i class="fas ${icon}"></i>
            <strong class="text-truncate" style="max-width: 150px;">${escapeHtml(room.name)}</strong>
          </div>
          <span class="badge bg-danger rounded-pill d-none unread-badge">0</span>
        </div>
        <div class="small text-muted text-truncate mt-1">${escapeHtml(snippet)}</div>
      `;

      div.addEventListener('click', () => {
        document.querySelectorAll('.chat-room-item').forEach((i) => i.classList.remove('active'));
        div.classList.add('active');
        div.querySelector('.unread-badge').classList.add('d-none');
        div.querySelector('.unread-badge').textContent = '0';
        onRoomSelect(room);
      });

      elements.chatRoomList.appendChild(div);
    });
  };

  const incrementRoomUnread = (roomId) => {
    const item = document.querySelector(`.chat-room-item[data-room-id="${roomId}"]`);
    if (item && !item.classList.contains('active')) {
      const badge = item.querySelector('.unread-badge');
      if (badge) {
        const count = parseInt(badge.textContent || '0', 10) + 1;
        badge.textContent = count;
        badge.classList.remove('d-none');
      }
    }
  };

  const renderMessages = (messages, currentUserId) => {
    if (!elements.chatMessages) return;
    elements.chatMessages.innerHTML = '';

    if (!messages || messages.length === 0) {
      elements.chatMessages.innerHTML = `
        <div class="text-center text-muted my-auto">
          <i class="far fa-comments fa-3x mb-2 text-muted"></i>
          <p class="mb-0">No messages yet. Send a message to start the conversation!</p>
        </div>
      `;
      return;
    }

    messages.forEach((msg) => {
      appendMessageToChat(msg, false);
    });

    scrollToBottom();
  };

  const appendMessageToChat = (msg, shouldScroll = true) => {
    if (!elements.chatMessages) return;

    // Check if empty placeholder exists
    const placeholder = elements.chatMessages.querySelector('.fa-comments');
    if (placeholder) {
      elements.chatMessages.innerHTML = '';
    }

    const currentUser = Auth.getUser();
    const isMe = currentUser && parseInt(currentUser.id, 10) === parseInt(msg.senderId || msg.sender_id, 10);

    const timeStr = new Date(msg.createdAt || msg.created_at || Date.now()).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Tick icons for my messages
    let statusIcon = '';
    if (isMe) {
      const status = msg.status || 'sent';
      if (status === 'read') {
        statusIcon = '<i class="fas fa-check-double text-info ms-1" title="Read"></i>';
      } else if (status === 'delivered') {
        statusIcon = '<i class="fas fa-check-double ms-1" title="Delivered"></i>';
      } else {
        statusIcon = '<i class="fas fa-check ms-1" title="Sent"></i>';
      }
    }

    const senderName = isMe ? 'You' : (msg.sender?.name || (msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : 'User'));
    const senderRole = msg.sender?.role ? ` <span class="badge bg-secondary" style="font-size:0.65rem">${escapeHtml(msg.sender.role)}</span>` : '';

    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${isMe ? 'me' : 'other'}`;
    bubble.dataset.messageId = msg.id;

    bubble.innerHTML = `
      ${!isMe ? `<div class="small fw-bold mb-1">${escapeHtml(senderName)}${senderRole}</div>` : ''}
      <div>${escapeHtml(msg.content)}</div>
      <div class="message-meta">
        <span>${timeStr}</span>
        ${statusIcon}
      </div>
    `;

    elements.chatMessages.appendChild(bubble);

    if (shouldScroll) {
      scrollToBottom();
    }
  };

  const updateMessageStatus = (messageId, status) => {
    const bubble = document.querySelector(`.message-bubble[data-message-id="${messageId}"]`);
    if (bubble && bubble.classList.contains('me')) {
      const meta = bubble.querySelector('.message-meta');
      if (meta) {
        const time = meta.querySelector('span')?.textContent || '';
        const icon = status === 'read'
          ? '<i class="fas fa-check-double text-info ms-1" title="Read"></i>'
          : '<i class="fas fa-check-double ms-1" title="Delivered"></i>';
        meta.innerHTML = `<span>${time}</span>${icon}`;
      }
    }
  };

  const scrollToBottom = () => {
    if (elements.chatMessages) {
      elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
  };

  const showTypingIndicator = (text) => {
    if (elements.typingIndicator) {
      elements.typingIndicator.textContent = text;
    }
  };

  const hideTypingIndicator = () => {
    if (elements.typingIndicator) {
      elements.typingIndicator.textContent = '';
    }
  };

  const renderOnlineUsers = (users) => {
    const onlineListElem = document.getElementById('onlineUsersList');
    if (elements.onlineCountBadge) {
      elements.onlineCountBadge.textContent = users ? users.length : 0;
    }
    const dashboardOnlineCount = document.getElementById('dashOnlineUsersCount');
    if (dashboardOnlineCount) {
      dashboardOnlineCount.textContent = users ? users.length : 0;
    }

    if (!onlineListElem) return;
    onlineListElem.innerHTML = '';

    if (!users || users.length === 0) {
      onlineListElem.innerHTML = '<li class="list-group-item text-muted small text-center">No other users online</li>';
      return;
    }

    users.forEach((u) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex align-items-center justify-content-between p-2';
      li.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <div class="avatar-wrapper">
            <img src="${u.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + u.id}" class="avatar-img" style="width:30px;height:30px;" />
            <span class="status-dot online"></span>
          </div>
          <div>
            <div class="fw-bold small">${escapeHtml(u.first_name)} ${escapeHtml(u.last_name)}</div>
            <div class="text-muted" style="font-size:0.75rem;">${escapeHtml(u.role ? u.role.name : '')}</div>
          </div>
        </div>
        <button class="btn btn-sm btn-outline-primary direct-chat-btn" data-user-id="${u.id}">
          <i class="fas fa-paper-plane"></i>
        </button>
      `;
      onlineListElem.appendChild(li);
    });
  };

  const setUserOnline = (userId, isOnline) => {
    // Refresh online list
    if (SocketClient.getSocket()) {
      SocketClient.getSocket().emit('users:online');
    }
  };

  const addNotification = (notif) => {
    if (elements.notifCountBadge) {
      const current = parseInt(elements.notifCountBadge.textContent || '0', 10);
      elements.notifCountBadge.textContent = current + 1;
      elements.notifCountBadge.classList.remove('d-none');
    }

    if (elements.notifDropdownList) {
      const emptyMsg = elements.notifDropdownList.querySelector('.text-muted');
      if (emptyMsg) emptyMsg.remove();

      const itemHtml = `
        <a class="dropdown-item py-2 border-bottom notif-item" href="#" data-notif-id="${notif.id}">
          <div class="fw-bold small text-truncate">${escapeHtml(notif.title)}</div>
          <div class="text-muted small text-truncate">${escapeHtml(notif.content)}</div>
          <small class="text-muted" style="font-size:0.7rem;">Just now</small>
        </a>
      `;
      elements.notifDropdownList.insertAdjacentHTML('afterbegin', itemHtml);
    }
  };

  const renderNotifications = (notifications, unreadCount) => {
    if (elements.notifCountBadge) {
      elements.notifCountBadge.textContent = unreadCount || 0;
      if (unreadCount > 0) {
        elements.notifCountBadge.classList.remove('d-none');
      } else {
        elements.notifCountBadge.classList.add('d-none');
      }
    }

    const panelList = document.getElementById('notificationsPanelList');
    if (!panelList) return;
    panelList.innerHTML = '';

    if (!notifications || notifications.length === 0) {
      panelList.innerHTML = '<div class="text-center text-muted p-4">No notifications</div>';
      return;
    }

    notifications.forEach((item) => {
      const notif = item.notification || item;
      const isRead = item.is_read;
      const card = document.createElement('div');
      card.className = `card mb-2 shadow-sm ${!isRead ? 'border-primary' : ''}`;
      card.innerHTML = `
        <div class="card-body p-3 d-flex justify-content-between align-items-start">
          <div>
            <div class="d-flex align-items-center gap-2">
              <h6 class="mb-0 fw-bold">${escapeHtml(notif.title)}</h6>
              ${!isRead ? '<span class="badge bg-primary" style="font-size:0.7rem">New</span>' : ''}
              <span class="badge bg-light text-dark border" style="font-size:0.7rem">${escapeHtml(notif.type)}</span>
            </div>
            <p class="mb-1 text-secondary mt-1 small">${escapeHtml(notif.content)}</p>
            <small class="text-muted">${new Date(notif.created_at || Date.now()).toLocaleString()}</small>
          </div>
          ${!isRead ? `<button class="btn btn-sm btn-outline-secondary mark-read-btn" data-id="${notif.id}">Mark Read</button>` : ''}
        </div>
      `;
      panelList.appendChild(card);
    });
  };

  return {
    init,
    updateConnectionStatus,
    showToast,
    escapeHtml,
    renderRoomsList,
    incrementRoomUnread,
    renderMessages,
    appendMessageToChat,
    updateMessageStatus,
    scrollToBottom,
    showTypingIndicator,
    hideTypingIndicator,
    renderOnlineUsers,
    setUserOnline,
    addNotification,
    renderNotifications
  };
})();
