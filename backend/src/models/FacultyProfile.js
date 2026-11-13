const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FacultyProfile = sequelize.define('FacultyProfile', {
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
  employee_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  designation: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  qualification: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'faculty_profiles',
  timestamps: true
});

module.exports = FacultyProfile;
