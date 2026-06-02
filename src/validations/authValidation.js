const { body } = require('express-validator');

const loginValidation = [body('username').notEmpty(), body('password').notEmpty()];

module.exports = { loginValidation };
