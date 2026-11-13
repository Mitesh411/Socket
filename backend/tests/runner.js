/**
 * Automated Test Runner for College Real-Time Socket System
 * Tests REST Endpoints, JWT Authentication, Role Middlewares,
 * and Socket.IO Real-Time Messaging & Presence Events.
 */
process.env.NODE_ENV = 'test';
process.env.PORT = '5055';
process.env.JWT_SECRET = 'test_jwt_secret_college_2026';

const http = require('http');
const ioClient = require('socket.io-client');
const bcrypt = require('bcryptjs');
const { generateToken, verifyToken } = require('../src/utils/jwtHelper');
const { initSocketServer } = require('../src/sockets/socketServer');
const roomManager = require('../src/sockets/roomManager');
const userRepository = require('../src/repositories/userRepository');
const chatRepository = require('../src/repositories/chatRepository');
const notificationRepository = require('../src/repositories/notificationRepository');
const collegeRepository = require('../src/repositories/collegeRepository');

let server;
let serverUrl;

// In-Memory Test Store
const store = {
  users: [],
  colleges: [
    { id: 1, name: 'Massachusetts Institute of Technology', code: 'MIT', status: 'active' },
    { id: 2, name: 'Stanford University', code: 'STANFORD', status: 'active' }
  ],
  rooms: [
    { id: 1, college_id: 1, name: 'MIT Campus-Wide', type: 'college', is_active: true },
    { id: 2, college_id: 1, name: 'Computer Science Dept', type: 'department', is_active: true }
  ],
  messages: [],
  notifications: []
};

const setupTestMocks = async () => {
  const adminPass = await bcrypt.hash('Admin@123', 10);
  const facultyPass = await bcrypt.hash('Faculty@123', 10);
  const studentPass = await bcrypt.hash('Student@123', 10);

  store.users = [
    {
      id: 1,
      first_name: 'MIT',
      last_name: 'Admin',
      email: 'admin@mit.edu',
      password_hash: adminPass,
      college_id: 1,
      role: { id: 2, name: 'college_admin' },
      is_active: true,
      toJSON() { return { ...this }; }
    },
    {
      id: 2,
      first_name: 'Alan',
      last_name: 'Turing',
      email: 'faculty.cs@mit.edu',
      password_hash: facultyPass,
      college_id: 1,
      role: { id: 3, name: 'faculty' },
      is_active: true,
      faculty_profile: { department_id: 1 },
      toJSON() { return { ...this }; }
    },
    {
      id: 3,
      first_name: 'Alice',
      last_name: 'Johnson',
      email: 'student.cs@mit.edu',
      password_hash: studentPass,
      college_id: 1,
      role: { id: 4, name: 'student' },
      is_active: true,
      student_profile: { department_id: 1, batch_id: 1 },
      toJSON() { return { ...this }; }
    }
  ];

  // Mock User Repository
  userRepository.findByEmail = async (email) => store.users.find((u) => u.email === email) || null;
  userRepository.findById = async (id) => store.users.find((u) => u.id === parseInt(id, 10)) || null;
  userRepository.findAll = async () => store.users;
  userRepository.updateSocketSession = async () => ({ id: 1, is_online: true });
  userRepository.markSocketDisconnected = async () => ({ id: 1, is_online: false });
  userRepository.getOnlineUsers = async () => store.users.filter((u) => u.id !== 1);

  // Mock College Repository
  collegeRepository.findAllColleges = async () => store.colleges;
  collegeRepository.findCollegeById = async (id) => store.colleges.find((c) => c.id === parseInt(id, 10));

  // Mock Chat Repository
  chatRepository.findRoomById = async (roomId) => {
    return store.rooms.find((r) => r.id === parseInt(roomId, 10)) || null;
  };
  chatRepository.findRoomsForUser = async () => store.rooms;
  chatRepository.isMember = async () => true;
  chatRepository.createMessage = async (data) => {
    const msg = {
      id: store.messages.length + 1,
      chat_room_id: data.chat_room_id,
      sender_id: data.sender_id,
      content: data.content,
      message_type: data.message_type || 'text',
      created_at: new Date().toISOString()
    };
    store.messages.push(msg);
    return msg;
  };
  chatRepository.getMessages = async (roomId) => {
    return store.messages.filter((m) => m.chat_room_id === parseInt(roomId, 10));
  };
  chatRepository.markRoomAsRead = async () => true;
  chatRepository.updateDeliveryStatus = async () => true;

  // Mock Notification Repository
  notificationRepository.getUserNotifications = async () => [];
  notificationRepository.getUnreadCount = async () => 0;
  notificationRepository.getAnnouncements = async () => [
    { id: 1, title: 'Welcome Test Announcement', content: 'Testing feeds', priority: 'normal', created_at: new Date() }
  ];
  notificationRepository.createNotification = async (data) => ({ id: 1, ...data });

  // Mock Room Manager DB lookups
  roomManager.validateRoomAccess = async () => true;
  roomManager.getDefaultRoomsForUser = async (user) => [
    `user:${user.id}`,
    `college:${user.college_id}`,
    'room:1',
    'room:2'
  ];
};

const runTests = async () => {
  let passed = 0;
  let failed = 0;

  const assert = (condition, name) => {
    if (condition) {
      console.log(`  \x1b[32m✔ PASS\x1b[0m: ${name}`);
      passed++;
    } else {
      console.error(`  \x1b[31m✘ FAIL\x1b[0m: ${name}`);
      failed++;
    }
  };

  console.log('\n======================================================');
  console.log(' Starting Automated System & Socket Integration Tests');
  console.log('======================================================\n');

  try {
    await setupTestMocks();

    const app = require('../src/app');
    const httpServer = http.createServer(app);
    initSocketServer(httpServer);

    await new Promise((resolve) => {
      server = httpServer.listen(0, '127.0.0.1', () => {
        const assignedPort = server.address().port;
        serverUrl = `http://127.0.0.1:${assignedPort}`;
        resolve();
      });
    });

    console.log(`[Test Server] Listening on ${serverUrl}\n`);

    const fetchJson = async (url, options = {}) => {
      const fullUrl = `${serverUrl}${url}`;
      const res = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
        },
        ...options
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    };

    // TEST SUITE 1: REST & Authentication
    console.log('--- TEST SUITE 1: REST API & Authentication ---');

    // Health Check
    const health = await fetchJson('/api/v1/health');
    assert(health.status === 200 && health.data.status === 'healthy', 'Health check returns 200 & healthy status');

    // Invalid Login
    const invalidLogin = await fetchJson('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@mit.edu', password: 'WrongPassword' })
    });
    assert(invalidLogin.status === 401 && invalidLogin.data.success === false, 'Invalid credentials rejected with 401');

    // Admin Login
    const adminLogin = await fetchJson('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@mit.edu', password: 'Admin@123' })
    });
    assert(adminLogin.status === 200 && adminLogin.data.data.token, 'Admin login succeeds and returns JWT token');
    const adminToken = adminLogin.data.data.token;

    // Student Login
    const studentLogin = await fetchJson('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'student.cs@mit.edu', password: 'Student@123' })
    });
    assert(studentLogin.status === 200 && studentLogin.data.data.token, 'Student login succeeds and returns JWT token');
    const studentToken = studentLogin.data.data.token;

    // Faculty Login
    const facultyLogin = await fetchJson('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'faculty.cs@mit.edu', password: 'Faculty@123' })
    });
    assert(facultyLogin.status === 200 && facultyLogin.data.data.token, 'Faculty login succeeds and returns JWT token');
    const facultyToken = facultyLogin.data.data.token;

    // Protected Route without token
    const unauthMe = await fetchJson('/api/v1/auth/me');
    assert(unauthMe.status === 401, 'Protected /api/v1/auth/me rejected without token');

    // Protected Route with token
    const authMe = await fetchJson('/api/v1/auth/me', { token: adminToken });
    assert(authMe.status === 200 && authMe.data.data.email === 'admin@mit.edu', 'Protected /api/v1/auth/me returns profile');

    // TEST SUITE 2: Colleges & Chat REST APIs
    console.log('\n--- TEST SUITE 2: Colleges, Departments & Chat REST APIs ---');

    const colleges = await fetchJson('/api/v1/colleges', { token: adminToken });
    assert(colleges.status === 200 && colleges.data.data.length >= 2, 'Colleges listing returns registered colleges');

    const rooms = await fetchJson('/api/v1/chat/rooms', { token: studentToken });
    assert(rooms.status === 200 && rooms.data.data.length >= 2, 'Chat rooms listing returns accessible rooms');

    // TEST SUITE 3: Socket.IO Real-Time Communication
    console.log('\n--- TEST SUITE 3: Socket.IO Real-Time & Event Handling ---');

    // Rejected without token
    const badSocket = ioClient(serverUrl, { transports: ['websocket'], reconnection: false });
    const authReject = await new Promise((res) => {
      badSocket.on('connect_error', (err) => {
        badSocket.close();
        res(err.message.includes('Token') || err.message.includes('Authentication'));
      });
    });
    assert(authReject, 'Unauthenticated socket connection rejected by JWT middleware');

    // Connect Student Socket
    const studentSocket = ioClient(serverUrl, {
      auth: { token: studentToken },
      transports: ['websocket']
    });

    // Connect Faculty Socket
    const facultySocket = ioClient(serverUrl, {
      auth: { token: facultyToken },
      transports: ['websocket']
    });

    await Promise.all([
      new Promise((res) => studentSocket.on('connect', res)),
      new Promise((res) => facultySocket.on('connect', res))
    ]);
    assert(studentSocket.connected && facultySocket.connected, 'Authenticated Socket.IO clients connected successfully');

    // Join Room
    const joinResult = await new Promise((res) => {
      studentSocket.emit('room:join', { roomId: 1 }, (response) => res(response?.success));
    });
    assert(joinResult, 'Student socket joined room:1 successfully');

    // Real-Time Messaging & Broadcast
    const testContent = `Automated Broadcast Test ${Date.now()}`;
    const messagePromise = new Promise((res) => {
      facultySocket.on('message:received', (msg) => {
        if (msg.content === testContent) res(msg);
      });
    });

    studentSocket.emit('message:send', { roomId: 1, content: testContent });

    const receivedMsg = await Promise.race([
      messagePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4000))
    ]);
    assert(receivedMsg && receivedMsg.content === testContent, 'Real-time message sent was broadcast and received across sockets');

    // Typing presence indicator
    const typingPromise = new Promise((res) => {
      facultySocket.on('user:typing', (data) => {
        if (data.roomId === 1) res(data);
      });
    });
    studentSocket.emit('user:typing', { roomId: 1 });

    const typingReceived = await Promise.race([
      typingPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4000))
    ]);
    assert(typingReceived && typingReceived.name.includes('Alice'), 'Typing presence event received by room participants');

    // Clean up
    studentSocket.close();
    facultySocket.close();

    console.log('\n======================================================');
    console.log(` Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test execution failed:', error);
    if (server) server.close();
    process.exit(1);
  }
};

runTests();
