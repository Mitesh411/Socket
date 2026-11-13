const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Batch = sequelize.define('Batch', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  start_year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  end_year: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'batches',
  timestamps: true
});

module.exports = Batch;
