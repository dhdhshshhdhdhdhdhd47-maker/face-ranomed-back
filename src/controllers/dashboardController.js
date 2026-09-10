const { User, Attendance, Shift, Payroll } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const dashboardController = {
  /**
   * Admin Dashboard statistikasi
   */
  async adminStats(req, res) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Jami aktiv hodimlar
      const totalEmployees = await User.count({ where: { is_active: true, role: 'employee' } });

      // Bugun kelganlar
      const todayPresent = await Attendance.count({
        where: {
          check_in: {
            [Op.gte]: new Date(today + 'T00:00:00'),
            [Op.lt]: new Date(today + 'T23:59:59'),
          },
        },
      });

      // Bugun kechikkanlar
      const todayLate = await Attendance.count({
        where: {
          check_in: {
            [Op.gte]: new Date(today + 'T00:00:00'),
            [Op.lt]: new Date(today + 'T23:59:59'),
          },
          late_minutes: { [Op.gt]: 0 },
        },
      });

      // Bugungi dijurliklar
      const todayShifts = await Shift.count({ where: { shift_date: today } });

      // Kelmaganlar
      const todayAbsent = todayShifts - todayPresent;

      // Chiqish kartasi urilmagan
      const incompleteCheckouts = await Attendance.count({
        where: {
          check_out: null,
          check_in: {
            [Op.gte]: new Date(today + 'T00:00:00'),
            [Op.lt]: new Date(today + 'T23:59:59'),
          },
        },
      });

      // Oxirgi 7 kun davomati
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyAttendance = await Attendance.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('check_in')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        where: {
          check_in: { [Op.gte]: weekAgo },
        },
        group: [sequelize.fn('DATE', sequelize.col('check_in'))],
        order: [[sequelize.fn('DATE', sequelize.col('check_in')), 'ASC']],
        raw: true,
      });

      // So'nggi turniket hodisalari
      const recentEvents = await Attendance.findAll({
        where: {
          check_in: {
            [Op.gte]: new Date(today + 'T00:00:00'),
          },
        },
        include: [
          { model: User, as: 'user', attributes: ['id', 'full_name', 'department', 'avatar_url'] },
        ],
        order: [['check_in', 'DESC']],
        limit: 10,
      });

      res.json({
        totalEmployees,
        todayPresent,
        todayAbsent: Math.max(0, todayAbsent),
        todayLate,
        todayShifts,
        incompleteCheckouts,
        presentPercent: todayShifts > 0 ? Math.round((todayPresent / todayShifts) * 100) : 0,
        weeklyAttendance,
        recentEvents,
      });
    } catch (err) {
      console.error('Admin stats error:', err);
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Direktor Dashboard statistikasi
   */
  async directorStats(req, res) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Jami hodimlar
      const totalEmployees = await User.count({ where: { is_active: true, role: 'employee' } });

      // Bugungi davomat
      const todayPresent = await Attendance.count({
        where: {
          check_in: {
            [Op.gte]: new Date(today + 'T00:00:00'),
            [Op.lt]: new Date(today + 'T23:59:59'),
          },
        },
      });

      const todayLate = await Attendance.count({
        where: {
          check_in: {
            [Op.gte]: new Date(today + 'T00:00:00'),
            [Op.lt]: new Date(today + 'T23:59:59'),
          },
          late_minutes: { [Op.gt]: 0 },
        },
      });

      const todayShifts = await Shift.count({ where: { shift_date: today } });

      // Top-5 kechikuvchilar (oy davomida)
      const monthStart = new Date(currentYear, currentMonth - 1, 1);
      const monthEnd = new Date(currentYear, currentMonth, 0);

      const topLateEmployees = await Attendance.findAll({
        attributes: [
          'user_id',
          [sequelize.fn('SUM', sequelize.col('late_minutes')), 'total_late_minutes'],
          [sequelize.fn('COUNT', sequelize.col('Attendance.id')), 'late_count'],
        ],
        where: {
          check_in: { [Op.between]: [monthStart, monthEnd] },
          late_minutes: { [Op.gt]: 0 },
        },
        include: [
          { model: User, as: 'user', attributes: ['full_name', 'department', 'position'] },
        ],
        group: ['user_id', 'user.id', 'user.full_name', 'user.department', 'user.position'],
        order: [[sequelize.fn('SUM', sequelize.col('late_minutes')), 'DESC']],
        limit: 5,
        raw: true,
        nest: true,
      });

      // Oylik maosh statistikasi
      const payrollStats = await Payroll.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('base_salary')), 'total_base'],
          [sequelize.fn('SUM', sequelize.col('overtime_pay')), 'total_overtime'],
          [sequelize.fn('SUM', sequelize.col('penalties')), 'total_penalties'],
          [sequelize.fn('SUM', sequelize.col('net_salary')), 'total_net'],
        ],
        where: { month: currentMonth, year: currentYear },
        raw: true,
      });

      // Bo'limlar bo'yicha intizom
      const departmentStats = await Attendance.findAll({
        attributes: [
          [sequelize.col('user.department'), 'department'],
          [sequelize.fn('COUNT', sequelize.col('Attendance.id')), 'total_records'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN late_minutes = 0 THEN 1 ELSE 0 END")), 'on_time_count'],
        ],
        where: {
          check_in: { [Op.between]: [monthStart, monthEnd] },
        },
        include: [
          { model: User, as: 'user', attributes: [] },
        ],
        group: ['user.department'],
        raw: true,
      });

      const departmentDiscipline = departmentStats.map(d => ({
        department: d.department || 'Belgilanmagan',
        onTimePercent: d.total_records > 0
          ? Math.round((d.on_time_count / d.total_records) * 100) : 0,
        totalRecords: parseInt(d.total_records),
      }));

      res.json({
        totalEmployees,
        todayPresent,
        todayAbsent: Math.max(0, todayShifts - todayPresent),
        todayLate,
        presentPercent: todayShifts > 0 ? Math.round((todayPresent / todayShifts) * 100) : 0,
        topLateEmployees,
        payrollStats: payrollStats[0] || { total_base: 0, total_overtime: 0, total_penalties: 0, total_net: 0 },
        departmentDiscipline,
        month: currentMonth,
        year: currentYear,
      });
    } catch (err) {
      console.error('Director stats error:', err);
      res.status(500).json({ error: 'Server xatosi' });
    }
  },
};

module.exports = dashboardController;
