const { Leave, User } = require('../models');
const { Op } = require('sequelize');

const leaveController = {
  /**
   * Barcha arizalarni olish
   */
  async getAll(req, res) {
    try {
      const { user_id, status, type } = req.query;
      const where = {};

      if (user_id) where.user_id = user_id;
      if (status) where.status = status;
      if (type) where.type = type;

      const leaves = await Leave.findAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'full_name', 'department', 'position'] },
          { model: User, as: 'approver', attributes: ['id', 'full_name'] },
        ],
        order: [['created_at', 'DESC']],
      });

      res.json(leaves);
    } catch (err) {
      console.error('Get leaves error:', err);
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Yangi ariza yaratish
   */
  async create(req, res) {
    try {
      const { user_id, start_date, end_date, type, reason } = req.body;

      if (!user_id || !start_date || !end_date || !type) {
        return res.status(400).json({ error: 'Barcha maydonlarni to\'ldiring' });
      }

      const leave = await Leave.create({
        user_id,
        start_date,
        end_date,
        type,
        reason,
        status: 'pending',
      });

      res.status(201).json(leave);
    } catch (err) {
      console.error('Create leave error:', err);
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Arizani tasdiqlash / rad etish
   */
  async updateStatus(req, res) {
    try {
      const leave = await Leave.findByPk(req.params.id);
      if (!leave) {
        return res.status(404).json({ error: 'Ariza topilmadi' });
      }

      const { status } = req.body;
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status faqat approved yoki rejected bo\'lishi mumkin' });
      }

      await leave.update({
        status,
        approved_by: req.user.id,
      });

      res.json(leave);
    } catch (err) {
      res.status(500).json({ error: 'Server xatosi' });
    }
  },
};

module.exports = leaveController;
