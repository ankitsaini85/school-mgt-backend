const { body } = require('express-validator');

const studentValidation = [body('name').notEmpty(), body('classId').isMongoId()];

module.exports = { studentValidation };
