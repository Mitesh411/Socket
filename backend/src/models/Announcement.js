const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Announcement = sequelize.define('Announcement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  college_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  batch_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  target_role: {
    type: DataTypes.ENUM('all', 'faculty', 'student'),
    defaultValue: 'all'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high'),
    defaultValue: 'normal'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'announcements',
  timestamps: true
});

module.exports = Announcement;
