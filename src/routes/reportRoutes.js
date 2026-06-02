const express = require('express');
const { getReports, getDashboard } = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect, authorize('teacher', 'principal'));
router.get('/', getReports);
router.get('/dashboard', getDashboard);

module.exports = router;
