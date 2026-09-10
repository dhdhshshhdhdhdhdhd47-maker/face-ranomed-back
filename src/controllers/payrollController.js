const { Payroll, User, Attendance } = require('../models');
const PayrollService = require('../services/payroll');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

const payrollController = {
  /**
   * Oylik maosh hisobini olish
   */
  async getAll(req, res) {
    try {
      const { month, year, status } = req.query;
      const currentDate = new Date();
      const m = parseInt(month) || currentDate.getMonth() + 1;
      const y = parseInt(year) || currentDate.getFullYear();
      const where = { month: m, year: y };
      if (status) where.status = status;

      const payrolls = await Payroll.findAll({
        where,
        include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'department', 'position', 'hourly_rate'] }],
        order: [['net_salary', 'DESC']],
      });

      res.json(payrolls);
    } catch (err) {
      console.error('Get payroll error:', err);
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Oylik maosh hisobini qayta hisoblash (recalculate)
   */
  async calculate(req, res) {
    try {
      const { month, year } = req.body;
      const currentDate = new Date();
      const m = parseInt(month) || currentDate.getMonth() + 1;
      const y = parseInt(year) || currentDate.getFullYear();

      const activeUsers = await User.findAll({ where: { is_active: true } });
      const results = [];

      for (const user of activeUsers) {
        const data = await PayrollService.calculateMonthlyPayroll(user.id, m, y);

        const [payroll, created] = await Payroll.findOrCreate({
          where: { user_id: user.id, month: m, year: y },
          defaults: { ...data, status: 'draft' },
        });

        if (!created) {
          await payroll.update({ ...data });
        }

        results.push(payroll);
      }

      res.json({
        message: `${results.length} ta hodim uchun maosh hisoblandi`,
        month: m,
        year: y,
        payrolls: results,
      });
    } catch (err) {
      console.error('Calculate payroll error:', err);
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Excel eksport
   */
  async exportExcel(req, res) {
    try {
      const { month, year } = req.query;
      const currentDate = new Date();
      const m = parseInt(month) || currentDate.getMonth() + 1;
      const y = parseInt(year) || currentDate.getFullYear();

      const payrolls = await Payroll.findAll({
        where: { month: m, year: y },
        include: [{ model: User, as: 'user', attributes: ['full_name', 'department', 'position', 'hourly_rate'] }],
        order: [['net_salary', 'DESC']],
      });

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(`Maosh - ${m}/${y}`);

      sheet.columns = [
        { header: '№', key: 'no', width: 5 },
        { header: 'F.I.O', key: 'full_name', width: 25 },
        { header: 'Bo\'lim', key: 'department', width: 15 },
        { header: 'Lavozim', key: 'position', width: 15 },
        { header: 'Ish kunlari', key: 'total_worked_days', width: 12 },
        { header: 'Jami soat', key: 'total_hours', width: 12 },
        { header: 'Overtime soat', key: 'overtime_hours', width: 14 },
        { header: 'Asosiy maosh', key: 'base_salary', width: 15 },
        { header: 'Overtime to\'lov', key: 'overtime_pay', width: 15 },
        { header: 'Jarimalar', key: 'penalties', width: 12 },
        { header: 'Sof maosh', key: 'net_salary', width: 15 },
      ];

      // Header style
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).alignment = { horizontal: 'center' };

      payrolls.forEach((p, i) => {
        sheet.addRow({
          no: i + 1,
          full_name: p.user?.full_name || '-',
          department: p.user?.department || '-',
          position: p.user?.position || '-',
          total_worked_days: p.total_worked_days,
          total_hours: p.total_hours,
          overtime_hours: p.overtime_hours,
          base_salary: p.base_salary,
          overtime_pay: p.overtime_pay,
          penalties: p.penalties,
          net_salary: p.net_salary,
        });
      });

      // Jami qator
      const totalRow = sheet.addRow({
        no: '',
        full_name: 'JAMI:',
        department: '',
        position: '',
        total_worked_days: '',
        total_hours: '',
        overtime_hours: '',
        base_salary: payrolls.reduce((s, p) => s + p.base_salary, 0),
        overtime_pay: payrolls.reduce((s, p) => s + p.overtime_pay, 0),
        penalties: payrolls.reduce((s, p) => s + p.penalties, 0),
        net_salary: payrolls.reduce((s, p) => s + p.net_salary, 0),
      });
      totalRow.font = { bold: true };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=maosh_${m}_${y}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error('Export excel error:', err);
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Maosh statusini yangilash (confirm/paid)
   */
  async updateStatus(req, res) {
    try {
      const { month, year, status } = req.body;
      await Payroll.update(
        { status },
        { where: { month, year } }
      );
      res.json({ message: `Barcha maosh hisoblari ${status} holatiga o'tkazildi` });
    } catch (err) {
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Bitta maosh statusini yangilash
   */
  async updateSingleStatus(req, res) {
    try {
      const { status } = req.body;
      const payroll = await Payroll.findByPk(req.params.id);
      if (!payroll) {
        return res.status(404).json({ error: 'Maosh topilmadi' });
      }
      await payroll.update({ status });
      res.json({ message: 'Status yangilandi', payroll });
    } catch (err) {
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Avans kiritish yoki yangilash
   */
  async setAdvance(req, res) {
    try {
      const payroll = await Payroll.findByPk(req.params.id);
      if (!payroll) {
        return res.status(404).json({ error: 'Maosh topilmadi' });
      }

      const { advance_payment } = req.body;
      const advance = parseFloat(advance_payment) || 0;

      // Net maoshni avansdan keyin qayta hisoblash
      const rawNet = payroll.base_salary + payroll.overtime_pay - payroll.penalties;
      const netAfterAdvance = Math.max(0, rawNet - advance);

      await payroll.update({
        advance_payment: advance,
        net_salary: Math.round(netAfterAdvance),
      });

      res.json({ message: 'Avans yangilandi', payroll });
    } catch (err) {
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Bitta xodimning maoshi (Bot uchun)
   */
  async getByUser(req, res) {
    try {
      const { userId } = req.params;
      const currentDate = new Date();
      const month = parseInt(req.query.month) || currentDate.getMonth() + 1;
      const year = parseInt(req.query.year) || currentDate.getFullYear();

      const payroll = await Payroll.findOne({
        where: { user_id: userId, month, year },
        include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'hourly_rate'] }],
      });

      if (!payroll) {
        return res.status(404).json({ error: 'Maosh ma\'lumoti topilmadi. Hali hisoblanmagan bo\'lishi mumkin.' });
      }

      res.json(payroll);
    } catch (err) {
      res.status(500).json({ error: 'Server xatosi' });
    }
  },
};

module.exports = payrollController;
