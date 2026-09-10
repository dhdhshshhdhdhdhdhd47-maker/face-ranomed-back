const bcrypt = require('bcryptjs');
const { User } = require('./src/models');
const sequelize = require('./src/config/database');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    const password = await bcrypt.hash('123456', 10);
    await User.create({
      full_name: 'Isroiljon (Admin)',
      phone: '+998938215511',
      password: password,
      role: 'admin',
      department: 'Boshqaruv',
      position: 'Rahbar',
      is_active: true
    });
    console.log('✅ Admin muvaffaqiyatli yaratildi!');
    process.exit(0);
  } catch (error) {
    console.error('Xatolik:', error);
    process.exit(1);
  }
}

createAdmin();
