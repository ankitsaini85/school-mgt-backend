const express = require('express');
const { login } = require('../controllers/authController');
const validate = require('../middlewares/validationMiddleware');
const { loginValidation } = require('../validations/authValidation');

const router = express.Router();

router.post('/login', loginValidation, validate, login);

module.exports = router;
