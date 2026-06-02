const asyncHandler = require('../middlewares/asyncHandler');
const {
  getSetupStatus,
  createPrincipalAccount,
  seedDemoData,
} = require('../utils/setupService');

const setupStatus = asyncHandler(async (req, res) => {
  const status = await getSetupStatus();
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });
  res.json(status);
});

const bootstrapSetup = asyncHandler(async (req, res) => {
  const status = await getSetupStatus();
  if (status.initialized) {
    return res.status(409).json({ message: 'System already initialized' });
  }

  const { principalName, principalEmail, principalUsername, principalPassword, includeDemoData } = req.body;

  if (!principalName || !principalEmail || !principalUsername || !principalPassword) {
    return res.status(400).json({ message: 'Principal details are required' });
  }

  if (principalPassword.length < 6) {
    return res.status(400).json({ message: 'Principal password must be at least 6 characters' });
  }

  await createPrincipalAccount({
    name: principalName,
    email: principalEmail,
    username: principalUsername,
    password: principalPassword,
  });

  if (includeDemoData) {
    await seedDemoData();
  }

  return res.status(201).json({
    message: 'First-time setup completed',
    includeDemoData: Boolean(includeDemoData),
  });
});

module.exports = {
  setupStatus,
  bootstrapSetup,
};
