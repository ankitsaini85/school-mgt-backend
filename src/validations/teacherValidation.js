const { body } = require('express-validator');

const teacherValidation = [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('username').notEmpty(),
  body('password').optional().isLength({ min: 6 }),
  body('assignedClasses').optional().isArray(),
];

module.exports = { teacherValidation };
