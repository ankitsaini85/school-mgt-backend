const express = require('express');
const {
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { teacherValidation } = require('../validations/teacherValidation');

const router = express.Router();

router.use(protect, authorize('principal'));
router.get('/', getTeachers);
router.post('/', teacherValidation, validate, createTeacher);
router.put('/:id', teacherValidation, validate, updateTeacher);
router.delete('/:id', deleteTeacher);

module.exports = router;
