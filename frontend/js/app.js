/**
 * Main Application Controller
 */
const App = (() => {
  let activeRoom = null;
  let allRooms = [];

  const init = async () => {
    UI.init();
    attachAuthHandlers();
    attachNavHandlers();
    attachChatHandlers();
    attachManagementHandlers();

    if (Auth.isAuthenticated()) {
      showAppShell();
      await loadInitialData();
      SocketClient.init();
    } else {
      showAuthShell();
    }
  };

  const showAuthShell = () => {
    document.getElementById('authSection').classList.remove('d-none');
    document.getElementById('appSection').classList.add('d-none');
  };

  const showAppShell = () => {
    document.getElementById('authSection').classList.add('d-none');
    document.getElementById('appSection').classList.remove('d-none');

    const user = Auth.getUser();
    if (user) {
      document.getElementById('navUserName').textContent = `${user.first_name} ${user.last_name}`;
      document.getElementById('navUserRole').textContent = (user.role?.name || user.role || 'User').toUpperCase();
      document.getElementById('navCollegeName').textContent = user.college?.name || (user.college_id ? `College #${user.college_id}` : 'Global Admin');
      if (user.avatar_url) {
        document.getElementById('navUserAvatar').src = user.avatar_url;
      }

      // Hide or show admin-only navigation links
      const roleName = user.role?.name || user.role;
      const adminLinks = document.querySelectorAll('.admin-only');
      adminLinks.forEach((el) => {
        if (['super_admin', 'college_admin'].includes(roleName)) {
          el.classList.remove('d-none');
        } else {
          el.classList.add('d-none');
        }
      });
    }
  };

  const attachAuthHandlers = () => {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        try {
          await Auth.login(email, password);
          showAppShell();
          await loadInitialData();
          SocketClient.init();
          UI.showToast('Welcome!', 'Signed in successfully', 'success');
        } catch (err) {
          UI.showToast('Login Failed', err.message, 'danger');
        }
      });
    }

    // Quick Login Chips
    document.querySelectorAll('.role-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.getElementById('loginEmail').value = chip.dataset.email;
        document.getElementById('loginPassword').value = chip.dataset.password;
      });
    });

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          first_name: document.getElementById('regFirstName').value,
          last_name: document.getElementById('regLastName').value,
          email: document.getElementById('regEmail').value,
          password: document.getElementById('regPassword').value,
          role_id: parseInt(document.getElementById('regRole').value, 10),
          college_id: parseInt(document.getElementById('regCollegeId').value || '1', 10),
          enrollment_no: document.getElementById('regEnrollment').value || null,
          batch_id: 1,
          department_id: 1
        };
        try {
          const res = await Api.register(data);
          Auth.setSession(res.data.token, res.data.user);
          showAppShell();
          await loadInitialData();
          SocketClient.init();
          UI.showToast('Registered', 'Your account has been created', 'success');
        } catch (err) {
          UI.showToast('Registration Error', err.message, 'danger');
        }
      });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
        showAuthShell();
        UI.showToast('Logged Out', 'You have been disconnected', 'info');
      });
    }

    // Tab toggle between Login & Register
    const showRegisterLink = document.getElementById('showRegisterLink');
    const showLoginLink = document.getElementById('showLoginLink');
    if (showRegisterLink && showLoginLink) {
      showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginCard').classList.add('d-none');
        document.getElementById('registerCard').classList.remove('d-none');
      });
      showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('registerCard').classList.add('d-none');
        document.getElementById('loginCard').classList.remove('d-none');
      });
    }
  };

  const attachNavHandlers = () => {
    document.querySelectorAll('.sidebar .nav-link[data-view]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.sidebar .nav-link').forEach((l) => l.classList.remove('active'));
        link.classList.add('active');

        const view = link.dataset.view;
        switchView(view);
      });
    });
  };

  const switchView = async (viewName) => {
    document.querySelectorAll('.app-view').forEach((v) => v.classList.add('d-none'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.classList.remove('d-none');
    }

    if (viewName === 'dashboard') loadDashboard();
    else if (viewName === 'chat') loadChatView();
    else if (viewName === 'colleges') loadCollegesView();
    else if (viewName === 'departments') loadDepartmentsView();
    else if (viewName === 'students') loadStudentsView();
    else if (viewName === 'faculty') loadFacultyView();
    else if (viewName === 'notifications') loadNotificationsView();
    else if (viewName === 'profile') loadProfileView();
  };

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadRooms(),
        loadNotificationsData(),
        loadDashboard()
      ]);
    } catch (e) {
      console.error('Initial data load error:', e);
    }
  };

  // --- Dashboard ---
  const loadDashboard = async () => {
    try {
      const collegesRes = await Api.getColleges().catch(() => ({ data: [] }));
      const roomsRes = await Api.getRooms().catch(() => ({ data: [] }));
      const announcementsRes = await Api.getAnnouncements().catch(() => ({ data: [] }));

      document.getElementById('dashCollegesCount').textContent = collegesRes.data?.length || 0;
      document.getElementById('dashRoomsCount').textContent = roomsRes.data?.length || 0;

      // Render Announcements list
      const annList = document.getElementById('dashAnnouncementsList');
      if (annList) {
        annList.innerHTML = '';
        const list = announcementsRes.data || [];
        if (list.length === 0) {
          annList.innerHTML = '<li class="list-group-item text-muted small">No announcements posted</li>';
        } else {
          list.slice(0, 5).forEach((a) => {
            const li = document.createElement('li');
            li.className = 'list-group-item p-3';
            li.innerHTML = `
              <div class="d-flex justify-content-between align-items-center mb-1">
                <strong class="text-primary">${UI.escapeHtml(a.title)}</strong>
                <span class="badge bg-danger rounded-pill">${UI.escapeHtml(a.priority)}</span>
              </div>
              <p class="mb-1 text-secondary small">${UI.escapeHtml(a.content)}</p>
              <small class="text-muted"><i class="far fa-clock me-1"></i>${new Date(a.created_at).toLocaleDateString()} by ${UI.escapeHtml(a.creator?.first_name || 'Admin')}</small>
            `;
            annList.appendChild(li);
          });
        }
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  };

  // --- Chat ---
  const loadRooms = async () => {
    try {
      const res = await Api.getRooms();
      allRooms = res.data || [];
      UI.renderRoomsList(allRooms, activeRoom?.id, selectRoom);
      if (allRooms.length > 0 && !activeRoom) {
        selectRoom(allRooms[0]);
      }
    } catch (err) {
      console.error('Error loading chat rooms:', err);
    }
  };

  const loadChatView = async () => {
    if (!allRooms || allRooms.length === 0) {
      await loadRooms();
    }
  };

  const selectRoom = async (room) => {
    if (activeRoom && activeRoom.id !== room.id) {
      SocketClient.leaveRoom(activeRoom.id);
    }

    activeRoom = room;
    SocketClient.joinRoom(room.id);

    // Update Header
    document.getElementById('currentRoomTitle').textContent = room.name;
    document.getElementById('currentRoomSubtitle').textContent = `Type: ${room.type.toUpperCase()} | Channel ID: #${room.id}`;

    // Fetch Messages
    try {
      const res = await Api.getMessages(room.id, 50);
      UI.renderMessages(res.data || [], Auth.getUser()?.id);

      // Send read receipt for last message
      if (res.data && res.data.length > 0) {
        const lastMsg = res.data[res.data.length - 1];
        Api.markRoomRead(room.id, lastMsg.id).catch(() => {});
      }
    } catch (err) {
      console.error('Error fetching room messages:', err);
    }
  };

  const attachChatHandlers = () => {
    const messageForm = document.getElementById('chatMessageForm');
    const messageInput = document.getElementById('chatMessageInput');

    if (messageForm && messageInput) {
      messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = messageInput.value.trim();
        if (!content || !activeRoom) return;

        try {
          SocketClient.sendMessage(activeRoom.id, content, 'text');
          messageInput.value = '';
          messageInput.focus();
        } catch (err) {
          UI.showToast('Error', err.message, 'danger');
        }
      });

      // Typing event emitter
      messageInput.addEventListener('input', () => {
        if (activeRoom) {
          SocketClient.sendTyping(activeRoom.id);
        }
      });
    }

    // Modal: Create Group Chat
    const createGroupForm = document.getElementById('createGroupForm');
    if (createGroupForm) {
      createGroupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('groupRoomName').value;
        try {
          const res = await Api.createGroupRoom(name, []);
          await loadRooms();
          selectRoom(res.data);
          bootstrap.Modal.getInstance(document.getElementById('createGroupModal')).hide();
          UI.showToast('Group Created', `Room "${name}" created`, 'success');
        } catch (err) {
          UI.showToast('Group Error', err.message, 'danger');
        }
      });
    }

    // Direct Chat Trigger from Online Users List
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.direct-chat-btn');
      if (btn) {
        const userId = parseInt(btn.dataset.userId, 10);
        try {
          const res = await Api.getDirectRoom(userId);
          await loadRooms();
          switchView('chat');
          selectRoom(res.data);
        } catch (err) {
          UI.showToast('Chat Error', err.message, 'danger');
        }
      }
    });
  };

  // --- Management & Directories ---
  const attachManagementHandlers = () => {
    // New College Form
    const newCollegeForm = document.getElementById('newCollegeForm');
    if (newCollegeForm) {
      newCollegeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          name: document.getElementById('collegeNameInput').value,
          code: document.getElementById('collegeCodeInput').value,
          address: document.getElementById('collegeAddressInput').value,
          contact_email: document.getElementById('collegeEmailInput').value
        };
        try {
          await Api.createCollege(data);
          bootstrap.Modal.getInstance(document.getElementById('newCollegeModal')).hide();
          UI.showToast('College Created', `${data.name} added`, 'success');
          loadCollegesView();
        } catch (err) {
          UI.showToast('Error', err.message, 'danger');
        }
      });
    }

    // New Department Form
    const newDeptForm = document.getElementById('newDeptForm');
    if (newDeptForm) {
      newDeptForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = Auth.getUser();
        const data = {
          college_id: user.college_id || 1,
          name: document.getElementById('deptNameInput').value,
          code: document.getElementById('deptCodeInput').value
        };
        try {
          await Api.createDepartment(data);
          bootstrap.Modal.getInstance(document.getElementById('newDeptModal')).hide();
          UI.showToast('Department Added', `${data.name} created`, 'success');
          loadDepartmentsView();
        } catch (err) {
          UI.showToast('Error', err.message, 'danger');
        }
      });
    }

    // New Announcement / Notification
    const newAnnouncementForm = document.getElementById('newAnnouncementForm');
    if (newAnnouncementForm) {
      newAnnouncementForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          title: document.getElementById('annTitleInput').value,
          content: document.getElementById('annContentInput').value,
          priority: document.getElementById('annPriorityInput').value,
          target_role: document.getElementById('annTargetRoleInput').value
        };
        try {
          await Api.createAnnouncement(data);
          bootstrap.Modal.getInstance(document.getElementById('newAnnouncementModal')).hide();
          UI.showToast('Announcement Published', 'Announcement has been broadcasted', 'success');
          loadDashboard();
        } catch (err) {
          UI.showToast('Error', err.message, 'danger');
        }
      });
    }

    // Mark Read listener
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.mark-read-btn');
      if (btn) {
        const notifId = btn.dataset.id;
        try {
          await Api.markNotificationRead(notifId);
          await loadNotificationsData();
          loadNotificationsView();
        } catch (err) {
          console.error('Mark read error:', err);
        }
      }
    });

    // Mark All Read Button
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', async () => {
        try {
          await Api.markAllNotificationsRead();
          await loadNotificationsData();
          loadNotificationsView();
          UI.showToast('Notifications', 'All marked as read', 'success');
        } catch (err) {
          UI.showToast('Error', err.message, 'danger');
        }
      });
    }
  };

  const loadCollegesView = async () => {
    const tableBody = document.getElementById('collegesTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-3">Loading colleges...</td></tr>';
    try {
      const res = await Api.getColleges();
      tableBody.innerHTML = '';
      (res.data || []).forEach((c) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${UI.escapeHtml(c.name)}</strong></td>
          <td><span class="badge bg-secondary">${UI.escapeHtml(c.code)}</span></td>
          <td>${UI.escapeHtml(c.contact_email || 'N/A')}</td>
          <td><span class="badge bg-success">${UI.escapeHtml(c.status)}</span></td>
          <td><small class="text-muted">${new Date(c.created_at).toLocaleDateString()}</small></td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-danger text-center p-3">${err.message}</td></tr>`;
    }
  };

  const loadDepartmentsView = async () => {
    const tableBody = document.getElementById('departmentsTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center p-3">Loading departments...</td></tr>';
    const user = Auth.getUser();
    try {
      const res = await Api.getDepartments(user.college_id || 1);
      tableBody.innerHTML = '';
      (res.data || []).forEach((d) => {
        const tr = document.createElement('tr');
        const courseNames = (d.courses || []).map((c) => c.name).join(', ') || 'No courses listed';
        tr.innerHTML = `
          <td><strong>${UI.escapeHtml(d.name)}</strong></td>
          <td><span class="badge bg-info text-dark">${UI.escapeHtml(d.code)}</span></td>
          <td>${UI.escapeHtml(courseNames)}</td>
          <td><small class="text-muted">${new Date(d.created_at).toLocaleDateString()}</small></td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="4" class="text-danger text-center p-3">${err.message}</td></tr>`;
    }
  };

  const loadStudentsView = async () => {
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-3">Loading student directory...</td></tr>';
    try {
      const res = await Api.getStudents();
      tableBody.innerHTML = '';
      (res.data || []).forEach((sp) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${UI.escapeHtml(sp.enrollment_no)}</td>
          <td><strong>${UI.escapeHtml(sp.user?.first_name)} ${UI.escapeHtml(sp.user?.last_name)}</strong></td>
          <td>${UI.escapeHtml(sp.user?.email)}</td>
          <td>${UI.escapeHtml(sp.department?.name || 'CSE')}</td>
          <td><span class="badge bg-primary">Semester ${sp.semester}</span></td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-danger text-center p-3">${err.message}</td></tr>`;
    }
  };

  const loadFacultyView = async () => {
    const tableBody = document.getElementById('facultyTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-3">Loading faculty directory...</td></tr>';
    try {
      const res = await Api.getFaculty();
      tableBody.innerHTML = '';
      (res.data || []).forEach((fp) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${UI.escapeHtml(fp.employee_id)}</td>
          <td><strong>${UI.escapeHtml(fp.user?.first_name)} ${UI.escapeHtml(fp.user?.last_name)}</strong></td>
          <td>${UI.escapeHtml(fp.designation)}</td>
          <td>${UI.escapeHtml(fp.department?.name || 'CSE')}</td>
          <td>${UI.escapeHtml(fp.qualification || 'Ph.D.')}</td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-danger text-center p-3">${err.message}</td></tr>`;
    }
  };

  const loadNotificationsData = async () => {
    try {
      const res = await Api.getNotifications();
      UI.renderNotifications(res.data?.notifications || [], res.data?.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const loadNotificationsView = async () => {
    await loadNotificationsData();
  };

  const loadProfileView = () => {
    const user = Auth.getUser();
    if (!user) return;
    document.getElementById('profileFullName').textContent = `${user.first_name} ${user.last_name}`;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileRole').textContent = user.role?.name || user.role;
    document.getElementById('profileCollege').textContent = user.college?.name || 'Universal';
    document.getElementById('profilePhone').textContent = user.phone || 'Not provided';
    document.getElementById('profileStatus').textContent = user.is_active ? 'Active' : 'Inactive';
    if (user.avatar_url) {
      document.getElementById('profileAvatarImg').src = user.avatar_url;
    }
  };

  return {
    init,
    switchView,
    loadInitialData
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
