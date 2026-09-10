const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Shift = sequelize.define('Shift', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  shift_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  start_time: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  end_time: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  shift_type: {
    type: DataTypes.ENUM('day', 'night', 'flex'),
    defaultValue: 'day',
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'absent'),
    defaultValue: 'scheduled',
  },
}, {
  tableName: 'shifts',
});

module.exports = Shift;
