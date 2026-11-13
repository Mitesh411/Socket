# College-Based Real-Time Socket Communication System

A modular, scalable, containerized real-time communication platform built for colleges and universities using **Node.js, Express, Socket.IO, MySQL, Sequelize ORM, Swagger/OpenAPI 3.0, Bootstrap 5, and Docker Compose**.

---

## 1. System Architecture & Features

```
┌────────────────────────────────────────────────────────┐
│               Responsive Frontend UI                  │
│       HTML5 · CSS3 · Bootstrap 5 · Vanilla JS          │
│       Live Chat · Online Presence · Notifications      │
└──────────────────────────▲─────────────────────────────┘
                           │ WebSocket / HTTP
┌──────────────────────────▼─────────────────────────────┐
│                 Node.js / Express.js                   │
│         REST APIs · Socket.IO Server · JWT Auth        │
│          Swagger UI Documentation (/api-docs)          │
│      Role-Based Access Control · Room Isolation        │
└──────────────────────────▲─────────────────────────────┘
                           │ Sequelize ORM (Connection Pool)
┌──────────────────────────▼─────────────────────────────┐
│                       MySQL 8.0                        │
│   Normalized Relational DB · Migrations · Seed Data    │
│  Colleges · Departments · Courses · Batches · Messages │
└────────────────────────────────────────────────────────┘
```

### Core Capabilities
- **Multi-College Data Isolation**: Supports multiple independent colleges with strict access boundaries.
- **Hierarchical Socket Channels**: Auto-joining channels based on user identity:
  - `college:<collegeId>`: Campus-wide broadcasts
  - `department:<departmentId>`: Departmental notices and chats
  - `batch:<batchId>`: Class and batch discussions
  - `user:<userId>`: Direct alerts & private messages
- **Real-Time Presence**: Online/offline indicators, active socket counters, typing indicators.
- **Message Tracking**: Delivery status and read status indicators (single tick = sent, double tick = delivered, blue tick = read).
- **Interactive Swagger UI**: Interactive OpenAPI 3.0 documentation with JWT Bearer authorization at `http://localhost:5000/api-docs`.
- **Role-Based Access Control**:
  - `super_admin`: Global control across all colleges
  - `college_admin`: College operations, departments, courses, faculty, students
  - `faculty`: Announcements, assignments, departmental channels, direct messaging
  - `student`: Batch discussions, campus feed, direct chats, live notifications

---

## 2. Default Test Credentials

The database seeds automatically with sample institutions, departments, courses, and pre-configured accounts:

| Role | Email | Password | Affiliation |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@college.edu` | `Admin@123` | Global System Administrator |
| **College Admin** | `admin@mit.edu` | `Admin@123` | Massachusetts Institute of Technology |
| **College Admin 2** | `admin@stanford.edu` | `Admin@123` | Stanford University |
| **Faculty** | `faculty.cs@mit.edu` | `Faculty@123` | Prof. Alan Turing (Computer Science) |
| **Student 1** | `student.cs@mit.edu` | `Student@123` | Alice Johnson (MIT CSE Batch 2024) |
| **Student 2** | `student2.cs@mit.edu` | `Student@123` | Bob Smith (MIT CSE Batch 2024) |

> **Tip**: The login page contains **1-click quick login chips** to instantly sign in as any of the roles above without typing!

---

## 3. Quick Start with Docker Compose

The complete stack (MySQL 8.0, Node.js Backend, and Nginx Frontend) starts with a single command:

```bash
docker compose up --build
```

### Services & Endpoints
- **Frontend Web Dashboard**: `http://localhost:3000` (or `http://localhost:5000`)
- **Backend REST API**: `http://localhost:5000/api/v1`
- **Swagger OpenAPI Documentation**: `http://localhost:5000/api-docs`
- **Socket.IO Server**: `ws://localhost:5000`
- **MySQL Database**: `localhost:3306` (Database: `college_socket_db`, User: `college_user`, Password: `college_pass123`)

---

## 4. Manual Local Setup (Without Docker)

### Prerequisites
- Node.js v18+ (tested on Node 20 / 22 / 24)
- MySQL 8.0+ running on port 3306

### Steps
1. **Configure Environment Variables**:
   ```bash
   cd backend
   cp .env.example .env
   ```
   Edit `.env` to match your MySQL connection details.

2. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Initialize Database & Seed Data**:
   ```bash
   npm run seed
   ```

4. **Start Backend Server**:
   ```bash
   npm start
   # or development mode:
   npm run dev
   ```

5. **Open Frontend**:
   Open `http://localhost:5000` directly in your browser (served by Express) or open `frontend/index.html` via any static HTTP server.

---

## 5. Automated Testing

Run the automated integration test suite that tests REST APIs, JWT authentication, and real-time Socket.IO communication:

```bash
cd backend
npm test
```

Expected output:
```text
======================================================
 Starting Automated System & Socket Integration Tests
======================================================
  ✔ PASS: Health check returns 200 & healthy status
  ✔ PASS: Invalid credentials rejected with 401
  ✔ PASS: Admin login succeeds and returns JWT token
  ✔ PASS: Student login succeeds and returns JWT token
  ✔ PASS: Faculty login succeeds and returns JWT token
  ✔ PASS: Protected /api/v1/auth/me rejected without token
  ✔ PASS: Protected /api/v1/auth/me returns profile
  ✔ PASS: Colleges listing returns registered colleges
  ✔ PASS: Chat rooms listing returns accessible rooms
  ✔ PASS: Unauthenticated socket connection rejected by JWT middleware
  ✔ PASS: Authenticated Socket.IO clients connected successfully
  ✔ PASS: Student socket joined room:1 successfully
  ✔ PASS: Real-time message sent was broadcast and received across sockets
  ✔ PASS: Typing presence event received by room participants
======================================================
 Test Summary: 14 Passed, 0 Failed
======================================================
```

---

## 6. Directory Structure

```text
Socket/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js            # Sequelize connection & retry pool
│   │   ├── models/                    # Sequelize relational models
│   │   │   ├── index.js               # Model definitions & associations
│   │   │   ├── College.js
│   │   │   ├── Department.js
│   │   │   ├── Course.js
│   │   │   ├── Batch.js
│   │   │   ├── Role.js
│   │   │   ├── User.js
│   │   │   ├── StudentProfile.js
│   │   │   ├── FacultyProfile.js
│   │   │   ├── SocketSession.js
│   │   │   ├── ChatRoom.js
│   │   │   ├── ChatRoomMember.js
│   │   │   ├── Message.js
│   │   │   ├── MessageStatus.js
│   │   │   ├── Notification.js
│   │   │   ├── UserNotification.js
│   │   │   └── Announcement.js
│   │   ├── repositories/              # Database data access layer
│   │   │   ├── userRepository.js
│   │   │   ├── collegeRepository.js
│   │   │   ├── chatRepository.js
│   │   │   └── notificationRepository.js
│   │   ├── services/                  # Business logic layer
│   │   │   ├── authService.js
│   │   │   ├── userService.js
│   │   │   ├── collegeService.js
│   │   │   ├── chatService.js
│   │   │   └── notificationService.js
│   │   ├── controllers/               # Express request handlers
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── collegeController.js
│   │   │   ├── chatController.js
│   │   │   └── notificationController.js
│   │   ├── middlewares/               # JWT auth, role check, rate limiting
│   │   │   ├── authMiddleware.js
│   │   │   ├── roleMiddleware.js
│   │   │   ├── rateLimiter.js
│   │   │   └── errorHandler.js
│   │   ├── routes/                    # REST API route declarations
│   │   │   ├── index.js
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── collegeRoutes.js
│   │   │   ├── chatRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   └── announcementRoutes.js
│   │   ├── sockets/                   # Real-time WebSocket engine
│   │   │   ├── socketServer.js        # Socket.IO initialization
│   │   │   ├── socketAuth.js          # JWT handshake authentication
│   │   │   ├── socketEvents.js        # Message, presence & notification handlers
│   │   │   └── roomManager.js         # College & channel routing
│   │   ├── swagger/
│   │   │   └── swagger.js             # OpenAPI 3.0 specifications
│   │   ├── utils/
│   │   │   ├── apiResponse.js         # Consistent JSON payload wrapper
│   │   │   ├── jwtHelper.js           # JWT signing & verification
│   │   │   └── logger.js              # Timestamped logger
│   │   ├── app.js                     # Express app setup
│   │   └── server.js                  # Server entrypoint
│   ├── database/
│   │   ├── init.sql                   # MySQL relational schema DDL
│   │   └── seed.js                    # Database seeder
│   ├── tests/
│   │   └── runner.js                  # Automated test suite
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── index.html                     # Responsive single-page application
│   ├── css/
│   │   └── styles.css                 # Collegiate UI, chat bubbles & indicators
│   ├── js/
│   │   ├── config.js                  # Environment & API routing
│   │   ├── api.js                     # REST API client
│   │   ├── auth.js                    # JWT session storage
│   │   ├── socket.js                  # Socket.IO client manager
│   │   ├── ui.js                      # DOM rendering & toasts
│   │   └── app.js                     # Controller & view coordinator
│   ├── Dockerfile
│   └── nginx.conf                     # Nginx proxy configuration
├── docker-compose.yml                 # Multi-container orchestration
├── API_SOCKET_DOCS.md                 # Detailed Socket & API reference
├── .env.example
└── README.md
```

---

## 7. Security Best Practices Implemented
- **BCrypt Password Hashing**: Passwords stored with salted 10-round bcrypt hashes.
- **JWT Authentication**: Enforced across both REST API endpoints and Socket.IO handshakes.
- **Role-Based Authorization**: Enforces role constraints (`super_admin`, `college_admin`, `faculty`, `student`).
- **Data Isolation**: Departmental and campus rooms are partitioned per college.
- **Rate Limiting**: `express-rate-limit` guards against brute-force attacks on `/api/v1/auth`.
- **HTTP Header Security**: Helmet-protected HTTP headers and CORS policies.
