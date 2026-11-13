const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const College = sequelize.define('College', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  contact_email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  contact_phone: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  }
}, {
  tableName: 'colleges',
  timestamps: true
});

module.exports = College;
