const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  position: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  card_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  face_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  hourly_rate: {
    type: DataTypes.FLOAT,
    defaultValue: 25000,
  },
  daily_rate: {
    type: DataTypes.FLOAT,
    defaultValue: 200000,
  },
  penalty_per_minute: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  overtime_coefficient: {
    type: DataTypes.FLOAT,
    defaultValue: 1.5,
  },
  role: {
    type: DataTypes.ENUM('admin', 'director', 'employee'),
    defaultValue: 'employee',
  },
  telegram_chat_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'users',
});

module.exports = User;
