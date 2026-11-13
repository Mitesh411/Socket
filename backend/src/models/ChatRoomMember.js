const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatRoomMember = sequelize.define('ChatRoomMember', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  chat_room_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member'
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_read_message_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'chat_room_members',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['chat_room_id', 'user_id']
    }
  ]
});

module.exports = ChatRoomMember;
