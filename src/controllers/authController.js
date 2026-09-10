const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

const authController = {
  /**
   * Login - JWT token olish
   */
  async login(req, res) {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        return res.status(400).json({ error: 'Telefon raqam va parol talab qilinadi' });
      }

      const user = await User.findOne({ where: { phone, is_active: true } });
      if (!user) {
        return res.status(401).json({ error: 'Noto\'g\'ri telefon raqam yoki parol' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Noto\'g\'ri telefon raqam yoki parol' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, full_name: user.full_name },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          role: user.role,
          department: user.department,
          position: user.position,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server xatosi' });
    }
  },

  /**
   * Joriy foydalanuvchi ma'lumotlari
   */
  async me(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
      });
      if (!user) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      }
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Server xatosi' });
    }
  },
};

module.exports = authController;
