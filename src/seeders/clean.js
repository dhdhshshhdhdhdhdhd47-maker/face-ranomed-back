const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const sequelize = require('../config/database');
const { User, Shift, Attendance, Payroll, Leave } = require('../models');

async function cleanDatabase() {
  try {
    console.log('🔄 Baza tozalanmoqda...');
    
    // Force sync tables (drops all tables and recreates them clean)
    await sequelize.sync({ force: true });
    console.log('✅ Barcha jadvallar tozalandi va qayta yaratildi');

    const password = await bcrypt.hash('5511', 10);

    // Boshlang'ich Admin akkaunti
    const admin = await User.create({
      full_name: 'Isroiljon (Admin)',
      phone: '+998938215511',
      department: 'Boshqaruv',
      position: 'Tizim Administratori',
      card_id: 'ADMIN001',
      hourly_rate: 35000,
      penalty_per_minute: 0,
      overtime_coefficient: 1.5,
      role: 'admin',
      password,
      is_active: true,
    });



    console.log('✅ Admin akkaunti yaratildi');
    console.log('\n========================================');
    console.log('🎉 Bazadan barcha mock ma\'lumotlar muvaffaqiyatli tozalandi!');
    console.log('========================================');
    console.log('📋 Tizimga kirish ma\'lumotlari:');
    console.log('   Admin:    +998938215511 / parol: 5511');
    console.log('\nEndi o\'zingiz yangi hodimlar kiritib tekshirishingiz mumkin.\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Bazani tozalashda xatolik:', err);
    process.exit(1);
  }
}

cleanDatabase();
