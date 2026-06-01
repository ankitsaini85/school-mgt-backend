require('dotenv').config();

const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const { seedDemoData } = require('../src/utils/setupService');

const run = async () => {
  try {
    await connectDB();

    const principalUsername = process.env.SEED_PRINCIPAL_USERNAME || 'principal';
    const principalEmail = process.env.SEED_PRINCIPAL_EMAIL || 'principal@school.com';
    const principalPassword = process.env.SEED_PRINCIPAL_PASSWORD || 'principal123';

    const existingPrincipal = await User.findOne({ role: 'principal' });
    if (!existingPrincipal) {
      await User.create({
        name: process.env.SEED_PRINCIPAL_NAME || 'Principal Admin',
        email: principalEmail,
        username: principalUsername,
        password: principalPassword,
        role: 'principal',
      });
      // eslint-disable-next-line no-console
      console.log('Principal seed created');
    }

    await seedDemoData();
    // eslint-disable-next-line no-console
    console.log('Demo classes, teachers, students and fee records seeded');
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

run();
