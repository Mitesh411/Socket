const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SocketSession = sequelize.define('SocketSession', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  socket_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  device_info: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_online: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_seen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'socket_sessions',
  timestamps: true
});

module.exports = SocketSession;
