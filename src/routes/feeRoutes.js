const express = require('express');
const { getFees, bulkUpdateFees } = require('../controllers/feeController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { bulkFeeValidation } = require('../validations/feeValidation');

const router = express.Router();

router.use(protect, authorize('teacher', 'principal'));
router.get('/', getFees);
router.post('/bulk-update', bulkFeeValidation, validate, bulkUpdateFees);

module.exports = router;
