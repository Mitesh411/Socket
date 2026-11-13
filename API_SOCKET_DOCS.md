# College Real-Time Socket Communication System - API & Socket Events Documentation

## 1. Socket.IO Connection & Authentication

The Socket.IO server requires JWT Bearer authentication at the handshake level.

### Handshake Protocol
```javascript
const socket = io("http://localhost:5000", {
  auth: {
    token: "<JWT_BEARER_TOKEN>"
  },
  transports: ["websocket", "polling"]
});
```

### Auto-Joined Channels
Upon successful authentication, the server automatically routes the user into isolated socket rooms based on their institution, department, and academic batch:
1. **Private User Room**: `user:<userId>` (for personal direct alerts and message status)
2. **College Room**: `college:<collegeId>` (for college-wide announcements and campus events)
3. **Department Room**: `department:<departmentId>` (for departmental broadcasts)
4. **Batch Room**: `batch:<batchId>` (for course/batch-level discussions)
5. **Joined Chat Rooms**: `room:<chatRoomId>` for each conversation membership

---

## 2. Socket Events Reference

### A. Connection & Presence Events

| Event Name | Direction | Payload Example | Description |
| :--- | :--- | :--- | :--- |
| `connection` | Client -> Server | Handshake `auth: { token }` | Initiates authenticated connection |
| `user:online` | Server -> Room Broadcast | `{"userId": 3, "name": "Alice Johnson", "role": "student", "timestamp": "2026-11-12T10:00:00Z"}` | Broadcasted to college when user connects |
| `user:offline` | Server -> Room Broadcast | `{"userId": 3, "name": "Alice Johnson", "timestamp": "2026-11-12T10:30:00Z"}` | Broadcasted when user's last socket disconnects |
| `users:online` | Client <-> Server | `[{"id": 3, "first_name": "Alice", "role": {"name": "student"}}]` | Fetches active users in the current college |
| `user:typing` | Client -> Server -> Room | `{"roomId": 1}` -> `{"roomId": 1, "userId": 3, "name": "Alice Johnson"}` | Emitted when user types in active chat input |
| `user:stop_typing`| Client -> Server -> Room | `{"roomId": 1}` -> `{"roomId": 1, "userId": 3}` | Emitted when typing ceases or after timeout |

### B. Room Management Events

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `room:join` | Client -> Server | `{"roomId": 1}` | Request to join room. Backend verifies membership/college isolation |
| `room:joined` | Server -> Client | `{"room": "room:1"}` | Confirmation that client has successfully joined the channel |
| `room:leave` | Client -> Server | `{"roomId": 1}` | Leaves the specified room |

### C. Real-Time Messaging Events

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `message:send` | Client -> Server | `{"roomId": 1, "content": "Hello class!", "messageType": "text"}` | Sends a message. Server persists to MySQL, creates delivery status records, and broadcasts. |
| `message:received` | Server -> Room | `{"id": 42, "roomId": 1, "senderId": 3, "sender": {"name": "Alice", "role": "student"}, "content": "Hello class!", "createdAt": "..."}` | Broadcasted to all room members |
| `message:delivered` | Client <-> Server | `{"messageId": 42, "roomId": 1, "senderId": 2}` | Acknowledges message delivery on recipient client |
| `message:read` | Client <-> Server | `{"messageId": 42, "roomId": 1, "senderId": 2}` | Marks message as read; updates ticks to blue double-check |
| `message:error` | Server -> Client | `{"error": "Forbidden", "message": "Access denied"}` | Emitted when an unauthorized operation occurs |

### D. Real-Time Notification Events

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `notification:send` | Client -> Server | `{"title": "Exam Alert", "content": "Date sheet published", "priority": "high", "targetRole": "student"}` | Faculty/Admin emits high-priority announcement |
| `notification:received` | Server -> Target | `{"id": 10, "title": "Exam Alert", "content": "...", "priority": "high", "sender": {...}}` | Delivered in real time to target users/college |
| `notification:read` | Client -> Server | `{"notificationId": 10}` | Acknowledges notification read status |

---

## 3. REST API Reference

Swagger UI is accessible at: `http://localhost:5000/api-docs`

### Authentication Endpoints
- `POST /api/v1/auth/login`: Email & password login -> returns JWT token & user payload
- `POST /api/v1/auth/register`: Create student/faculty user account
- `GET /api/v1/auth/me`: Get current authenticated user profile (`Authorization: Bearer <token>`)
- `POST /api/v1/auth/logout`: Invalidate session

### College & Academic Hierarchy
- `GET /api/v1/colleges`: List all colleges (with data isolation)
- `POST /api/v1/colleges`: Create college (Super Admin)
- `GET /api/v1/colleges/:id`: Get college with departments and courses
- `GET /api/v1/colleges/departments/list?college_id=1`: List departments
- `POST /api/v1/colleges/departments/create`: Add department
- `GET /api/v1/colleges/courses/list?department_id=1`: List courses
- `POST /api/v1/colleges/courses/create`: Add course
- `GET /api/v1/colleges/batches/list?course_id=1`: List batches
- `POST /api/v1/colleges/batches/create`: Add batch

### Chat & Messaging REST API
- `GET /api/v1/chat/rooms`: List rooms accessible to authenticated user
- `POST /api/v1/chat/rooms`: Create group chat
- `POST /api/v1/chat/direct`: Start or retrieve direct 1-to-1 chat with another user
- `GET /api/v1/chat/rooms/:id/messages?limit=50&before_id=...`: Get message history with pagination
- `POST /api/v1/chat/rooms/:id/messages`: Send message via REST API
- `POST /api/v1/chat/rooms/:id/read`: Mark messages in room as read

### Notifications & Announcements
- `GET /api/v1/notifications`: List current user notifications & unread counter
- `POST /api/v1/notifications`: Send notification to role or user
- `PATCH /api/v1/notifications/:id/read`: Mark specific notification as read
- `PATCH /api/v1/notifications/read-all`: Mark all notifications as read
- `GET /api/v1/announcements`: List college announcements
- `POST /api/v1/announcements`: Post campus announcement
