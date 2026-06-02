const { body } = require('express-validator');

const bulkFeeValidation = [
  body('month').notEmpty(),
  body('year').isInt({ min: 2000 }),
  body('updates').isArray(),
];

module.exports = { bulkFeeValidation };
