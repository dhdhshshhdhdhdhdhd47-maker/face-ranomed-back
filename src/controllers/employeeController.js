const bcrypt = require('bcryptjs');
const { User, Shift, Attendance, Payroll, Leave } = require('../models');
const { Op } = require('sequelize');

const employeeController = {
  /**
   * Barcha hodimlarni olish
   */
  async getAll(req, res) {
    try {
      const { department, role, search, is_active } = req.query;
      const where = {};

      if (department) where.department = department;
      if (role) where.role = role;
      if (is_active !== undefined) {
        where.is_active = is_active === 'true';
      } else {
        where.is_active = true;
      }
      if (search) {
        where[Op.or] = [
          { full_name: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
          { card_id: { [Op.like]: `%${search}%` } },
        ];
      }

      const employees = await User.findAll({
        where,
        attributes: { exclude: ['password'] },
        order: [['full_name', 'ASC']],
      });

      res.json(employees);
    } catch (err) {
      console.error('Get employees error:', err);
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Bitta hodimni olish
   */
  async getById(req, res) {
    try {
      const employee = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] },
      });
      if (!employee) {
        return res.status(404).json({ error: 'Hodim topilmadi' });
      }
      res.json(employee);
    } catch (err) {
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Yangi hodim qo'shish
   */
  async create(req, res) {
    try {
      let { full_name, phone, department, position, card_id, face_id, daily_rate, hourly_rate, penalty_per_minute, overtime_coefficient, role, avatar_url } = req.body;
      
      card_id = card_id === '' ? null : card_id;
      face_id = face_id === '' ? null : face_id;

      if (!full_name) {
        return res.status(400).json({ error: 'F.I.O kiritish majburiy' });
      }

      // Parol yaratish (telefon raqamdan)
      const password = await bcrypt.hash(phone || '123456', 10);

      const employee = await User.create({
        full_name,
        phone,
        department,
        position,
        card_id,
        face_id,
        avatar_url,
        daily_rate: daily_rate || 200000,
        hourly_rate: hourly_rate || 25000,
        penalty_per_minute: penalty_per_minute || 0,
        overtime_coefficient: overtime_coefficient || 1.5,
        role: role || 'employee',
        password,
      });

      const result = employee.toJSON();
      delete result.password;

      res.status(201).json(result);
    } catch (err) {
      console.error('Create employee error:', err);
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'Bu karta ID allaqachon ishlatilmoqda' });
      }
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Hodimni tahrirlash
   */
  async update(req, res) {
    try {
      const employee = await User.findByPk(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: 'Hodim topilmadi' });
      }

      let { full_name, phone, department, position, card_id, face_id, daily_rate, hourly_rate, penalty_per_minute, overtime_coefficient, role, is_active, avatar_url } = req.body;

      card_id = card_id === '' ? null : card_id;
      face_id = face_id === '' ? null : face_id;

      await employee.update({
        full_name: full_name || employee.full_name,
        phone: phone !== undefined ? phone : employee.phone,
        department: department !== undefined ? department : employee.department,
        position: position !== undefined ? position : employee.position,
        card_id: card_id !== undefined ? card_id : employee.card_id,
        face_id: face_id !== undefined ? face_id : employee.face_id,
        avatar_url: avatar_url !== undefined ? avatar_url : employee.avatar_url,
        daily_rate: daily_rate !== undefined ? daily_rate : employee.daily_rate,
        hourly_rate: hourly_rate !== undefined ? hourly_rate : employee.hourly_rate,
        penalty_per_minute: penalty_per_minute !== undefined ? penalty_per_minute : employee.penalty_per_minute,
        overtime_coefficient: overtime_coefficient !== undefined ? overtime_coefficient : employee.overtime_coefficient,
        role: role || employee.role,
        is_active: is_active !== undefined ? is_active : employee.is_active,
      });

      const result = employee.toJSON();
      delete result.password;

      res.json(result);
    } catch (err) {
      console.error('Update employee error:', err);
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Hodimni o'chirish (soft delete)
   */
  async delete(req, res) {
    try {
      const employee = await User.findByPk(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: 'Hodim topilmadi' });
      }

      // Hodimga tegishli barcha bog'liq yozuvlarni tozalash (foreign key hatolarini oldini olish)
      await Shift.destroy({ where: { user_id: employee.id } });
      await Attendance.destroy({ where: { user_id: employee.id } });
      await Payroll.destroy({ where: { user_id: employee.id } });
      await Leave.destroy({ where: { [Op.or]: [{ user_id: employee.id }, { approved_by: employee.id }] } });

      await employee.destroy();
      res.json({ message: 'Hodim muvaffaqiyatli o\'chirildi' });
    } catch (err) {
      console.error('Delete employee error:', err);
      res.status(500).json({ error: err.message || 'Server xatosi' });
    }
  },

  /**
   * Bo'limlar ro'yxati
   */
  async getDepartments(req, res) {
    try {
      const departments = await User.findAll({
        attributes: ['department'],
        group: ['department'],
        where: { department: { [Op.ne]: null } },
      });
      res.json(departments.map(d => d.department).filter(Boolean));
    } catch (err) {
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Phone orqali qidirish (Telegram bot)
   */
  async findByPhone(req, res) {
    try {
      // "+998" va "998" kabi xilma-xilliklarni oldini olish uchun qidiruv
      const phone = req.params.phone;
      const employee = await User.findOne({
        where: { phone: { [Op.like]: `%${phone.replace('+', '')}%` } },
        attributes: ['id', 'full_name', 'department', 'position', 'card_id', 'hourly_rate', 'role', 'telegram_chat_id']
      });

      if (!employee) {
        return res.status(404).json({ error: 'Hodim topilmadi' });
      }
      res.json(employee);
    } catch (err) {
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Telegram Chat ID saqlash
   */
  async updateTelegramChatId(req, res) {
    try {
      const employee = await User.findByPk(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: 'Hodim topilmadi' });
      }

      const { telegram_chat_id } = req.body;
      await employee.update({ telegram_chat_id });

      res.json({ message: 'Telegram ulandi', employee });
    } catch (err) {
      res.status(500).json({ error: 'Server xatosi' });
    }
  }
};

module.exports = employeeController;
