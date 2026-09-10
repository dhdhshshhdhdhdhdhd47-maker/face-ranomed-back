const { Attendance, Shift, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Maosh hisoblash xizmati
 * Formula: Kunlik Maosh = (Ishlangan Soat × Soatbay Stavka) - (Kechikkan Daqiqalar × Jarima Stavkasi)
 * Overtime = Qo'shimcha Soat × Soatbay Stavka × Overtime Koeffitsienti
 */

// Default ish vaqti (smena belgilanmagan bo'lsa)
const DEFAULT_SHIFT_START = '07:40'; // Kirish vaqti
const DEFAULT_SHIFT_END   = '17:00'; // Ketish vaqti

class PayrollService {

  /**
   * Kunlik maosh hisoblash
   */
  static calculateDailySalary(workedHours, lateMinutes, user, shift) {
    const standardHours = this.getStandardHours(shift);
    const overtimeHours = Math.max(0, workedHours - standardHours);
    const regularHours = Math.min(workedHours, standardHours);

    // Kunlik stavka yoki soatlik stavka bo'yicha hisoblash
    const effectiveDailyRate = user.daily_rate || (user.hourly_rate * standardHours);
    const effectiveHourlyRate = user.hourly_rate || (effectiveDailyRate / standardHours);

    const completionRatio = Math.min(1, regularHours / Math.max(1, standardHours));
    const basePay = completionRatio * effectiveDailyRate;

    const penalty = 0; // Jarima bekor qilingan
    const overtimePay = overtimeHours * effectiveHourlyRate * (user.overtime_coefficient || 1.5);

    const dailySalary = Math.max(0, basePay + overtimePay);

    return {
      worked_hours: parseFloat(workedHours.toFixed(2)),
      late_minutes: lateMinutes,
      daily_salary: Math.round(dailySalary),
      penalty_amount: 0,
      overtime_hours: parseFloat(overtimeHours.toFixed(2)),
      overtime_pay: Math.round(overtimePay),
    };
  }

  /**
   * Smena uchun standart ish soatini aniqlash
   */
  static getStandardHours(shift) {
    const start = this.parseTime(shift ? shift.start_time : DEFAULT_SHIFT_START);
    const end   = this.parseTime(shift ? shift.end_time   : DEFAULT_SHIFT_END);
    let diff = end - start;
    if (diff <= 0) diff += 24 * 60; // Tungi smena
    return diff / 60;
  }

  /**
   * Kechikish daqiqalarini hisoblash
   * Smena belgilanmagan bo'lsa DEFAULT_SHIFT_START dan hisoblaydi
   */
  static calculateLateMinutes(checkInTime, shift) {
    const startTimeStr = shift ? shift.start_time : DEFAULT_SHIFT_START;
    const shiftStart = this.parseTime(startTimeStr);
    const checkIn = checkInTime.getHours() * 60 + checkInTime.getMinutes();

    let diff = checkIn - shiftStart;
    // Tungi smena uchun
    if (diff < -720) diff += 24 * 60;
    if (diff > 720) diff -= 24 * 60;

    return Math.max(0, diff);
  }

  /**
   * Ishlangan soatlarni hisoblash
   */
  static calculateWorkedHours(checkIn, checkOut) {
    if (!checkIn || !checkOut) return 0;
    const diffMs = new Date(checkOut) - new Date(checkIn);
    const hours = diffMs / (1000 * 60 * 60);
    // Tushlik uchun 1 soat ayirish (8 soatdan ortiq ishlasa)
    return hours > 5 ? hours - 1 : hours;
  }

  /**
   * Oylik maosh hisobini hisoblash
   */
  static async calculateMonthlyPayroll(userId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendances = await Attendance.findAll({
      where: {
        user_id: userId,
        check_in: {
          [Op.between]: [startDate, endDate],
        },
        status: { [Op.ne]: 'absent' },
      },
    });

    const user = await User.findByPk(userId);

    let totalHours = 0;
    let overtimeHours = 0;
    let baseSalary = 0;
    let overtimePay = 0;
    let penalties = 0;
    let workedDays = 0;

    for (const att of attendances) {
      if (att.worked_hours > 0) {
        workedDays++;
        totalHours += att.worked_hours;
        overtimeHours += att.overtime_hours || 0;
        baseSalary += (att.worked_hours - (att.overtime_hours || 0)) * user.hourly_rate;
        overtimePay += att.overtime_pay || 0;
        penalties += 0;
      }
    }

    const netSalary = Math.max(0, baseSalary + overtimePay);

    return {
      user_id: userId,
      month,
      year,
      total_worked_days: workedDays,
      total_hours: parseFloat(totalHours.toFixed(2)),
      overtime_hours: parseFloat(overtimeHours.toFixed(2)),
      base_salary: Math.round(baseSalary),
      overtime_pay: Math.round(overtimePay),
      penalties: 0,
      net_salary: Math.round(netSalary),
    };
  }

  /**
   * Vaqt stringini daqiqalarga aylantirish ("HH:MM" -> minutes)
   */
  static parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

module.exports = PayrollService;
