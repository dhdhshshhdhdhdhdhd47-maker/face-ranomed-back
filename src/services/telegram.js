const path = require('path');
const fs = require('fs');

/**
 * Telegram Bot xabar yuborish xizmati
 * Hozircha mock rejimda ishlaydi, keyin real Telegram API ulanadi
 */

class TelegramService {
  constructor() {
    this.enabled = false;
    // Real bot tokenini .env dan olish
    // if (process.env.TELEGRAM_BOT_TOKEN) {
    //   const TelegramBot = require('node-telegram-bot-api');
    //   this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
    //   this.enabled = true;
    // }
  }

  /**
   * Hodimga CHECK-IN xabari yuborish
   */
  async sendCheckInNotification(user, checkInTime, lateMinutes, shift) {
    const time = this.formatTime(checkInTime);
    const shiftInfo = shift ? `${shift.start_time} — ${shift.end_time}` : 'Belgilanmagan';
    const lateText = lateMinutes > 0
      ? `⚠️ ${lateMinutes} daqiqa kechikish`
      : '✅ 0 daqiqa (Barakalla!)';

    const message = `🟢 *CHECK-IN (Kirish qayd etildi)*\n`
      + `🕒 Vaqt: *${time}*\n`
      + `⏱ Kechikish: *${lateText}*\n`
      + `📌 Bugungi dijurligingiz: *${shiftInfo}*`;

    return this.sendPhotoMessage(user.telegram_chat_id, user.avatar_url, message);
  }

  /**
   * Hodimga CHECK-OUT xabari yuborish
   */
  async sendCheckOutNotification(user, checkOutTime, workedHours, dailySalary) {
    const time = this.formatTime(checkOutTime);
    const hours = Math.floor(workedHours);
    const minutes = Math.round((workedHours - hours) * 60);

    const message = `🔴 *CHECK-OUT (Chiqish qayd etildi)*\n`
      + `🕒 Vaqt: *${time}*\n`
      + `⏱ Bugungi ish vaqti: *${hours} soat ${minutes} daqiqa*\n`
      + `💰 Bugun hisoblangan kunlik maosh: *${this.formatMoney(dailySalary)} so'm*`;

    return this.sendPhotoMessage(user.telegram_chat_id, user.avatar_url, message);
  }

  /**
   * Dijurlik eslatmasi yuborish
   */
  async sendShiftReminder(user, shift) {
    const message = `⏰ *Eslatma*\n`
      + `Bugun soat *${shift.start_time}* da dijurligingiz boshlanadi.\n`
      + `Kelishni unutmang!`;

    return this.sendMessage(user.telegram_chat_id, message);
  }

  /**
   * Karta urish eslatmasi
   */
  async sendCardReminder(user) {
    const message = `⚠️ *Diqqat!*\n`
      + `Smenangiz tugadi, lekin ketayotganda turniketga karta urishni unutdingiz.\n`
      + `Iltimos, turniketdan o'ting!`;

    return this.sendMessage(user.telegram_chat_id, message);
  }

  /**
   * Direktorga kunlik davomat hisoboti
   */
  async sendDailyReport(chatId, report) {
    const message = `📊 *Bugungi Davomat Hisoboti*\n`
      + `━━━━━━━━━━━━━━━━━\n`
      + `👥 Jami hodimlar: *${report.total}*\n`
      + `✅ Ishda: *${report.present}* (${report.presentPercent}%)\n`
      + `❌ Kelmagan: *${report.absent}*\n`
      + `⏰ Kechikkan: *${report.late}*\n`
      + `━━━━━━━━━━━━━━━━━`;

    return this.sendMessage(chatId, message);
  }

  /**
   * Xabar yuborish
   */
  async sendMessage(chatId, message) {
    if (!chatId) {
      console.log('[TELEGRAM MOCK]:', message.replace(/\*/g, ''));
      return { success: true, mock: true };
    }

    if (this.enabled && this.bot) {
      try {
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        return { success: true };
      } catch (err) {
        console.error('[TELEGRAM ERROR]:', err.message);
        return { success: false, error: err.message };
      }
    }

    console.log('[TELEGRAM MOCK]:', message.replace(/\*/g, ''));
    return { success: true, mock: true };
  }

  /**
   * Rasm bilan xabar yuborish
   */
  async sendPhotoMessage(chatId, photoUrl, caption) {
    if (!chatId) {
      console.log(`[TELEGRAM MOCK PHOTO]: ${photoUrl}`);
      console.log(`[TELEGRAM MOCK CAPTION]:\n${caption.replace(/\*/g, '')}`);
      return { success: true, mock: true };
    }

    if (this.enabled && this.bot) {
      try {
        let photoData = photoUrl;
        
        if (photoUrl && photoUrl.startsWith('/uploads/')) {
          const absolutePath = path.join(__dirname, '../../public', photoUrl);
          if (fs.existsSync(absolutePath)) {
            photoData = absolutePath;
          }
        }
        
        if (photoData) {
          await this.bot.sendPhoto(chatId, photoData, { caption, parse_mode: 'Markdown' });
        } else {
          await this.bot.sendMessage(chatId, caption, { parse_mode: 'Markdown' });
        }
        return { success: true };
      } catch (err) {
        console.error('[TELEGRAM PHOTO ERROR]:', err.message);
        return { success: false, error: err.message };
      }
    }

    console.log(`[TELEGRAM MOCK PHOTO]: ${photoUrl}`);
    console.log(`[TELEGRAM MOCK CAPTION]:\n${caption.replace(/\*/g, '')}`);
    return { success: true, mock: true };
  }

  formatTime(date) {
    return new Date(date).toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  formatMoney(amount) {
    return new Intl.NumberFormat('uz-UZ').format(amount);
  }
}

module.exports = new TelegramService();
