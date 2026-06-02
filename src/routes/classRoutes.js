const express = require('express');
const { getClasses, createClass, updateClassFeeSetup, updateClassFundCasteMap } = require('../controllers/classController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { classValidation, classFeeSetupValidation } = require('../validations/classValidation');

const router = express.Router();

router.use(protect);
router.get('/', getClasses);
router.post('/', authorize('principal'), classValidation, validate, createClass);
router.put('/:id/fee-setup', authorize('principal'), classFeeSetupValidation, validate, updateClassFeeSetup);
router.put('/:id/fund-caste-map', authorize('principal'), updateClassFundCasteMap);

module.exports = router;
