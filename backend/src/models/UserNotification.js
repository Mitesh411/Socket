const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserNotification = sequelize.define('UserNotification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  notification_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'user_notifications',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['notification_id', 'user_id']
    }
  ]
});

module.exports = UserNotification;
