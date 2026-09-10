const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payroll = sequelize.define('Payroll', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  total_worked_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_hours: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  overtime_hours: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  base_salary: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  overtime_pay: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  penalties: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  net_salary: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  advance_payment: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Avans (oldindan olingan pul)',
  },
  status: {
    type: DataTypes.ENUM('draft', 'confirmed', 'paid'),
    defaultValue: 'draft',
  },
}, {
  tableName: 'payroll',
});

module.exports = Payroll;
