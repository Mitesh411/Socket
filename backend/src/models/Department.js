const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  college_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false
  }
}, {
  tableName: 'departments',
  timestamps: true
});

module.exports = Department;
