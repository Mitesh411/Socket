/**
 * REST API Client
 */
const Api = (() => {
  const getHeaders = (hasBody = true) => {
    const headers = {};
    if (hasBody) headers['Content-Type'] = 'application/json';
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const handleResponse = async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && Auth.getToken()) {
        Auth.logout();
        window.location.reload();
      }
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }
    return data;
  };

  const request = async (endpoint, method = 'GET', body = null) => {
    const options = {
      method,
      headers: getHeaders(body !== null)
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${Config.API_BASE}${endpoint}`, options);
    return handleResponse(res);
  };

  return {
    // Auth
    login: (email, password) => request('/auth/login', 'POST', { email, password }),
    register: (userData) => request('/auth/register', 'POST', userData),
    getMe: () => request('/auth/me', 'GET'),
    logout: () => request('/auth/logout', 'POST'),

    // Users
    getUsers: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/users${query ? '?' + query : ''}`);
    },
    getOnlineUsers: (collegeId) => request(`/users/online${collegeId ? '?college_id=' + collegeId : ''}`),
    getStudents: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/users/students${query ? '?' + query : ''}`);
    },
    getFaculty: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/users/faculty${query ? '?' + query : ''}`);
    },

    // Colleges
    getColleges: () => request('/colleges'),
    createCollege: (collegeData) => request('/colleges', 'POST', collegeData),
    getDepartments: (collegeId) => request(`/colleges/departments/list?college_id=${collegeId}`),
    createDepartment: (deptData) => request('/colleges/departments/create', 'POST', deptData),
    getCourses: (departmentId) => request(`/colleges/courses/list?department_id=${departmentId}`),
    createCourse: (courseData) => request('/colleges/courses/create', 'POST', courseData),
    getBatches: (courseId) => request(`/colleges/batches/list?course_id=${courseId}`),
    createBatch: (batchData) => request('/colleges/batches/create', 'POST', batchData),

    // Chat
    getRooms: () => request('/chat/rooms'),
    createGroupRoom: (name, memberIds) => request('/chat/rooms', 'POST', { name, member_ids: memberIds }),
    getDirectRoom: (recipientId) => request('/chat/direct', 'POST', { recipient_id: recipientId }),
    getMessages: (roomId, limit = 50, beforeId = null) => {
      const query = new URLSearchParams({ limit, ...(beforeId ? { before_id: beforeId } : {}) }).toString();
      return request(`/chat/rooms/${roomId}/messages?${query}`);
    },
    sendMessage: (roomId, content, messageType = 'text') =>
      request(`/chat/rooms/${roomId}/messages`, 'POST', { content, message_type: messageType }),
    markRoomRead: (roomId, lastMessageId) =>
      request(`/chat/rooms/${roomId}/read`, 'POST', { last_message_id: lastMessageId }),

    // Notifications
    getNotifications: (unreadOnly = false) => request(`/notifications?unread=${unreadOnly}`),
    sendNotification: (payload) => request('/notifications', 'POST', payload),
    markNotificationRead: (id) => request(`/notifications/${id}/read`, 'PATCH'),
    markAllNotificationsRead: () => request('/notifications/read-all', 'PATCH'),

    // Announcements
    getAnnouncements: (departmentId = null) =>
      request(`/announcements${departmentId ? '?department_id=' + departmentId : ''}`),
    createAnnouncement: (payload) => request('/announcements', 'POST', payload)
  };
})();
