const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  college_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('announcement', 'college', 'department', 'course', 'personal', 'system'),
    defaultValue: 'personal'
  },
  reference_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  reference_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high'),
    defaultValue: 'normal'
  }
}, {
  tableName: 'notifications',
  timestamps: true
});

module.exports = Notification;
