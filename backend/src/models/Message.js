const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  chat_room_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  message_type: {
    type: DataTypes.ENUM('text', 'announcement', 'system', 'file'),
    defaultValue: 'text'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  media_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  parent_message_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'messages',
  timestamps: true
});

module.exports = Message;
