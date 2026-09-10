const { Shift, User } = require('../models');
const { Op } = require('sequelize');

const shiftController = {
  /**
   * Dijurliklarni olish (filter: user_id, date range)
   */
  async getAll(req, res) {
    try {
      const { user_id, start_date, end_date, department } = req.query;
      const where = {};

      if (user_id) where.user_id = user_id;
      if (start_date && end_date) {
        where.shift_date = { [Op.between]: [start_date, end_date] };
      } else if (start_date) {
        where.shift_date = { [Op.gte]: start_date };
      }

      const include = [{
        model: User,
        as: 'user',
        attributes: ['id', 'full_name', 'department', 'position'],
      }];

      // Bo'lim bo'yicha filtr
      if (department) {
        include[0].where = { department };
      }

      const shifts = await Shift.findAll({
        where,
        include,
        order: [['shift_date', 'ASC'], ['start_time', 'ASC']],
      });

      res.json(shifts);
    } catch (err) {
      console.error('Get shifts error:', err);
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Yangi dijurlik qo'shish
   */
  async create(req, res) {
    try {
      const { user_id, shift_date, start_time, end_time, shift_type } = req.body;

      if (!user_id || !shift_date || !start_time || !end_time) {
        return res.status(400).json({ error: 'Barcha maydonlarni to\'ldiring' });
      }

      const shift = await Shift.create({
        user_id,
        shift_date,
        start_time,
        end_time,
        shift_type: shift_type || 'day',
      });

      const result = await Shift.findByPk(shift.id, {
        include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'department'] }],
      });

      res.status(201).json(result);
    } catch (err) {
      console.error('Create shift error:', err);
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Ko'plab dijurliklarni bir vaqtda qo'shish (Batch)
   */
  async createBatch(req, res) {
    try {
      const { shifts } = req.body;
      if (!Array.isArray(shifts) || shifts.length === 0) {
        return res.status(400).json({ error: 'Dijurliklar ro\'yxati bo\'sh' });
      }

      const created = await Shift.bulkCreate(shifts);
      res.status(201).json({ message: `${created.length} ta dijurlik yaratildi`, count: created.length });
    } catch (err) {
      console.error('Batch create shifts error:', err);
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Dijurlikni tahrirlash
   */
  async update(req, res) {
    try {
      const shift = await Shift.findByPk(req.params.id);
      if (!shift) {
        return res.status(404).json({ error: 'Dijurlik topilmadi' });
      }

      const { start_time, end_time, shift_type, status } = req.body;
      await shift.update({
        start_time: start_time || shift.start_time,
        end_time: end_time || shift.end_time,
        shift_type: shift_type || shift.shift_type,
        status: status || shift.status,
      });

      res.json(shift);
    } catch (err) {
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Dijurlikni o'chirish
   */
  async delete(req, res) {
    try {
      const shift = await Shift.findByPk(req.params.id);
      if (!shift) {
        return res.status(404).json({ error: 'Dijurlik topilmadi' });
      }
      await shift.destroy();
      res.json({ message: 'Dijurlik o\'chirildi' });
    } catch (err) {
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Bitta xodimning smenalari (Bot uchun)
   */
  async getByUser(req, res) {
    try {
      const { userId } = req.params;
      const now = new Date();
      // Bu haftaning boshi (Dushanba)
      const dayOfWeek = now.getDay() || 7; // 0=Yak → 7
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek + 1);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const startDate = monday.toISOString().split('T')[0];
      const endDate = sunday.toISOString().split('T')[0];

      const shifts = await Shift.findAll({
        where: {
          user_id: userId,
          shift_date: { [Op.between]: [startDate, endDate] },
        },
        order: [['shift_date', 'ASC']],
      });

      res.json(shifts);
    } catch (err) {
      res.status(500).json({ error: 'Server xatosi' });
    }
  },
};

module.exports = shiftController;
