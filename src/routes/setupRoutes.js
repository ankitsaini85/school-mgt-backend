const express = require('express');
const { setupStatus, bootstrapSetup } = require('../controllers/setupController');

const router = express.Router();

router.get('/status', setupStatus);
router.post('/bootstrap', bootstrapSetup);

module.exports = router;
