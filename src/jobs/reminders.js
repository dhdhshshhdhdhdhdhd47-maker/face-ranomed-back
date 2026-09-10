const cron = require('node-cron');
const { Shift, Attendance, User } = require('../models');
const { Op } = require('sequelize');
const telegramService = require('../services/telegram');

function setupCronJobs() {
  console.log('[CRON] Avtomatik vazifalar o\'rnatildi (10 minutlik eslatmalar bilan)');

  // Har 1 daqiqada: Dijurlik eslatmasi (10 daqiqa oldin)
  cron.schedule('*/1 * * * *', async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      const upcomingShifts = await Shift.findAll({
        where: {
          shift_date: today,
          status: 'scheduled',
        },
        include: [{ model: User, as: 'user' }],
      });

      for (const shift of upcomingShifts) {
        if (!shift.user || !shift.user.telegram_chat_id) continue;

        const [hours, minutes] = shift.start_time.split(':').map(Number);
        const shiftStart = new Date(now);
        shiftStart.setHours(hours, minutes, 0, 0);

        const diffMinutes = Math.round((shiftStart - now) / (1000 * 60));

        // Aynan 10 daqiqa qolganda eslatma
        if (diffMinutes === 10) {
          const msg = `⏰ <b>Eslatma!</b>\n\nSizning bugungi smenangiz (${shift.start_time} - ${shift.end_time}) boshlanishiga aniq <b>10 daqiqa</b> qoldi.\n\nTurniketdan o'tib "Check-In" qilishni unutmang.`;
          telegramService.sendMessage(shift.user.telegram_chat_id, msg);
        }
      }
    } catch (err) {
      console.error('[CRON] Shift reminder error:', err);
    }
  });

  // Har 10 daqiqada: Ketishda karta urishni unutganlar
  cron.schedule('*/10 * * * *', async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      const incompleteAttendances = await Attendance.findAll({
        where: {
          check_out: null,
          check_in: {
            [Op.gte]: new Date(today + 'T00:00:00'),
            [Op.lt]: new Date(today + 'T23:59:59'),
          },
        },
        include: [
          { model: User, as: 'user' },
          { model: Shift, as: 'shift' },
        ],
      });

      for (const att of incompleteAttendances) {
        if (!att.shift) continue;

        const [hours, minutes] = att.shift.end_time.split(':').map(Number);
        const shiftEnd = new Date(now);
        shiftEnd.setHours(hours, minutes, 0, 0);

        const diffMinutes = (now - shiftEnd) / (1000 * 60);

        // Smena tugaganidan 10-20 daqiqa o'tganda
        if (diffMinutes >= 10 && diffMinutes < 20) {
          if(att.user && att.user.telegram_chat_id) {
             const msg = `⚠️ Sizning ishlash vaqtingiz tugadi, lekin turniketdan chiqish kartasini urmadingiz.`;
             telegramService.sendMessage(att.user.telegram_chat_id, msg);
          }
        }
      }
    } catch (err) {
      console.error('[CRON] Card reminder error:', err);
    }
  });

  // Har kuni 10:00: Direktorga kunlik hisobot
  cron.schedule('0 10 * * *', async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const totalEmployees = await User.count({ where: { is_active: true, role: 'employee' } });
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

      const directors = await User.findAll({ where: { role: 'director', is_active: true } });

      const report = {
        total: totalEmployees,
        present: todayPresent,
        absent: totalEmployees - todayPresent,
        late: todayLate,
        presentPercent: totalEmployees > 0 ? Math.round((todayPresent / totalEmployees) * 100) : 0,
      };

      for (const director of directors) {
        if (director.telegram_chat_id) {
          const msg = `📊 Kunlik Hisobot\nJami xodimlar: ${report.total}\nKelganlar: ${report.present}\nKechikkanlar: ${report.late}`;
          telegramService.sendMessage(director.telegram_chat_id, msg);
        }
      }
    } catch (err) {
      console.error('[CRON] Daily report error:', err);
    }
  });
}

module.exports = setupCronJobs;
