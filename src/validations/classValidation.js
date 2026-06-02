const { body } = require('express-validator');

const classValidation = [body('name').notEmpty(), body('teacherId').optional().isMongoId()];

const classFeeSetupValidation = [
	body('totalFee').notEmpty().isFloat({ min: 0 }),
	body('fundPercentages')
		.isArray({ min: 8, max: 8 })
		.withMessage('fundPercentages must contain 8 percentage values for A-H'),
];

module.exports = { classValidation, classFeeSetupValidation };
