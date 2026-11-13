const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatRoom = sequelize.define('ChatRoom', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  college_id: {
    type: DataTypes.INTEGER,
    allowNull: true // Can be null for system-wide or global
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('direct', 'group', 'college', 'department', 'course', 'batch'),
    allowNull: false,
    defaultValue: 'group'
  },
  reference_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Links to department_id, batch_id, or course_id depending on room type'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'chat_rooms',
  timestamps: true
});

module.exports = ChatRoom;
