const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  shift_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  check_in: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  check_out: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  late_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  worked_hours: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  daily_salary: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  penalty_amount: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  overtime_hours: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  overtime_pay: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  is_manual_override: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  override_reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'leave', 'business_trip', 'incomplete'),
    defaultValue: 'present',
  },
}, {
  tableName: 'attendance',
});

module.exports = Attendance;
