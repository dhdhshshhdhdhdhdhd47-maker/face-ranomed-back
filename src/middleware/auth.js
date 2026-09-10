const jwt = require('jsonwebtoken');
require('dotenv').config();

const BOT_API_KEY = process.env.BOT_API_KEY || 'bot-internal-key-turniket-2024';

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    // Bot API key tekshiruvi (Telegram bot ichki so'rovlari uchun)
    const botKey = req.headers['x-bot-api-key'];
    if (botKey && botKey === BOT_API_KEY) {
      req.user = { role: 'bot', id: null };
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Ruxsat berilmagan' });
      }

      next();
    } catch (err) {
      return res.status(401).json({ error: 'Token yaroqsiz yoki muddati tugagan' });
    }
  };
};

module.exports = authMiddleware;
