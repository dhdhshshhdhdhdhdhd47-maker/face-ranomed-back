const User = require('./User');
const Shift = require('./Shift');
const Attendance = require('./Attendance');
const Payroll = require('./Payroll');
const Leave = require('./Leave');

// Associations
User.hasMany(Shift, { foreignKey: 'user_id', as: 'shifts' });
Shift.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Attendance, { foreignKey: 'user_id', as: 'attendances' });
Attendance.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Shift.hasOne(Attendance, { foreignKey: 'shift_id', as: 'attendance' });
Attendance.belongsTo(Shift, { foreignKey: 'shift_id', as: 'shift' });

User.hasMany(Payroll, { foreignKey: 'user_id', as: 'payrolls' });
Payroll.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Leave, { foreignKey: 'user_id', as: 'leaves' });
Leave.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Leave.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

module.exports = { User, Shift, Attendance, Payroll, Leave };
