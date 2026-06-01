require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { ensurePrincipalSeed } = require('./utils/seed');

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  try {
    await connectDB();
    await ensurePrincipalSeed();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Server start failed:', error.message);
    process.exit(1);
  }
};

bootstrap();
