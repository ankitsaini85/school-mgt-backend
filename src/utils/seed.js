const User = require('../models/User');

const ensurePrincipalSeed = async () => {
  const principalUsername = process.env.SEED_PRINCIPAL_USERNAME;
  const principalPassword = process.env.SEED_PRINCIPAL_PASSWORD;
  const principalEmail = process.env.SEED_PRINCIPAL_EMAIL;

  if (!principalUsername || !principalPassword || !principalEmail) {
    return;
  }

  const existing = await User.findOne({ username: principalUsername });
  if (existing) return;

  await User.create({
    name: process.env.SEED_PRINCIPAL_NAME || 'Principal',
    email: principalEmail,
    username: principalUsername,
    password: principalPassword,
    role: 'principal',
  });
};

module.exports = { ensurePrincipalSeed };
