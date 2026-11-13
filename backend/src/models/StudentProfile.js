const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudentProfile = sequelize.define('StudentProfile', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  enrollment_no: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  batch_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  semester: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'student_profiles',
  timestamps: true
});

module.exports = StudentProfile;
