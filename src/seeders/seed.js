/**
 * Faqat admin akkaunt yaratish — boshqa hamma narsani admin o'zi qo'shadi
 */
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const sequelize = require('../config/database');
const { User } = require('../models');

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('✅ Baza yaratildi (eski ma\'lumotlar o\'chirildi)');

    const password = await bcrypt.hash('5511', 10);

    // Faqat Admin akkaunt
    await User.create({
      full_name: 'Administrator',
      phone: '+998938215511',
      department: 'IT',
      position: 'Tizim Administratori',
      card_id: 'ADMIN001',
      hourly_rate: 35000,
      penalty_per_minute: 0,
      overtime_coefficient: 1.5,
      role: 'admin',
      password,
      is_active: true,
    });

    console.log('✅ Admin akkaunt yaratildi');
    console.log('\n========================================');
    console.log('🎉 Baza tayyor!');
    console.log('========================================');
    console.log('\n📋 Admin kirish ma\'lumotlari:');
    console.log('   Telefon: +998938215511');
    console.log('   Parol:   5511');
    console.log('\n👉 Endi hodimlar, bo\'limlar va smenalarni');
    console.log('   admin paneldan o\'zingiz qo\'shing.\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed xatosi:', err);
    process.exit(1);
  }
}

seed();
