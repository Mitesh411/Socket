const { sequelize } = require('../config/database');

const Role = require('./Role');
const College = require('./College');
const Department = require('./Department');
const Course = require('./Course');
const Batch = require('./Batch');
const User = require('./User');
const StudentProfile = require('./StudentProfile');
const FacultyProfile = require('./FacultyProfile');
const SocketSession = require('./SocketSession');
const ChatRoom = require('./ChatRoom');
const ChatRoomMember = require('./ChatRoomMember');
const Message = require('./Message');
const MessageStatus = require('./MessageStatus');
const Notification = require('./Notification');
const UserNotification = require('./UserNotification');
const Announcement = require('./Announcement');

// User & Role
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// User & College
College.hasMany(User, { foreignKey: 'college_id', as: 'users' });
User.belongsTo(College, { foreignKey: 'college_id', as: 'college' });

// College & Department
College.hasMany(Department, { foreignKey: 'college_id', as: 'departments', onDelete: 'CASCADE' });
Department.belongsTo(College, { foreignKey: 'college_id', as: 'college' });

// Department & Course
Department.hasMany(Course, { foreignKey: 'department_id', as: 'courses', onDelete: 'CASCADE' });
Course.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// Course & Batch
Course.hasMany(Batch, { foreignKey: 'course_id', as: 'batches', onDelete: 'CASCADE' });
Batch.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Student Profile
User.hasOne(StudentProfile, { foreignKey: 'user_id', as: 'student_profile', onDelete: 'CASCADE' });
StudentProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Batch.hasMany(StudentProfile, { foreignKey: 'batch_id', as: 'students' });
StudentProfile.belongsTo(Batch, { foreignKey: 'batch_id', as: 'batch' });

Department.hasMany(StudentProfile, { foreignKey: 'department_id', as: 'students' });
StudentProfile.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// Faculty Profile
User.hasOne(FacultyProfile, { foreignKey: 'user_id', as: 'faculty_profile', onDelete: 'CASCADE' });
FacultyProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Department.hasMany(FacultyProfile, { foreignKey: 'department_id', as: 'faculty_members' });
FacultyProfile.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// Socket Sessions
User.hasMany(SocketSession, { foreignKey: 'user_id', as: 'socket_sessions', onDelete: 'CASCADE' });
SocketSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Chat Rooms
College.hasMany(ChatRoom, { foreignKey: 'college_id', as: 'chat_rooms' });
ChatRoom.belongsTo(College, { foreignKey: 'college_id', as: 'college' });

User.hasMany(ChatRoom, { foreignKey: 'created_by', as: 'created_rooms' });
ChatRoom.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Chat Room Members
ChatRoom.hasMany(ChatRoomMember, { foreignKey: 'chat_room_id', as: 'members', onDelete: 'CASCADE' });
ChatRoomMember.belongsTo(ChatRoom, { foreignKey: 'chat_room_id', as: 'room' });

User.hasMany(ChatRoomMember, { foreignKey: 'user_id', as: 'room_memberships', onDelete: 'CASCADE' });
ChatRoomMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

ChatRoom.belongsToMany(User, { through: ChatRoomMember, foreignKey: 'chat_room_id', otherKey: 'user_id', as: 'participants' });
User.belongsToMany(ChatRoom, { through: ChatRoomMember, foreignKey: 'user_id', otherKey: 'chat_room_id', as: 'joined_rooms' });

// Messages
ChatRoom.hasMany(Message, { foreignKey: 'chat_room_id', as: 'messages', onDelete: 'CASCADE' });
Message.belongsTo(ChatRoom, { foreignKey: 'chat_room_id', as: 'room' });

User.hasMany(Message, { foreignKey: 'sender_id', as: 'sent_messages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

Message.hasMany(MessageStatus, { foreignKey: 'message_id', as: 'statuses', onDelete: 'CASCADE' });
MessageStatus.belongsTo(Message, { foreignKey: 'message_id', as: 'message' });

User.hasMany(MessageStatus, { foreignKey: 'user_id', as: 'message_statuses' });
MessageStatus.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Notifications
College.hasMany(Notification, { foreignKey: 'college_id', as: 'notifications' });
Notification.belongsTo(College, { foreignKey: 'college_id', as: 'college' });

User.hasMany(Notification, { foreignKey: 'sender_id', as: 'sent_notifications' });
Notification.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

Notification.hasMany(UserNotification, { foreignKey: 'notification_id', as: 'recipients', onDelete: 'CASCADE' });
UserNotification.belongsTo(Notification, { foreignKey: 'notification_id', as: 'notification' });

User.hasMany(UserNotification, { foreignKey: 'user_id', as: 'user_notifications', onDelete: 'CASCADE' });
UserNotification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Announcements
College.hasMany(Announcement, { foreignKey: 'college_id', as: 'announcements' });
Announcement.belongsTo(College, { foreignKey: 'college_id', as: 'college' });

Department.hasMany(Announcement, { foreignKey: 'department_id', as: 'announcements' });
Announcement.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

Course.hasMany(Announcement, { foreignKey: 'course_id', as: 'announcements' });
Announcement.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

Batch.hasMany(Announcement, { foreignKey: 'batch_id', as: 'announcements' });
Announcement.belongsTo(Batch, { foreignKey: 'batch_id', as: 'batch' });

User.hasMany(Announcement, { foreignKey: 'created_by', as: 'created_announcements' });
Announcement.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = {
  sequelize,
  Role,
  College,
  Department,
  Course,
  Batch,
  User,
  StudentProfile,
  FacultyProfile,
  SocketSession,
  ChatRoom,
  ChatRoomMember,
  Message,
  MessageStatus,
  Notification,
  UserNotification,
  Announcement
};
