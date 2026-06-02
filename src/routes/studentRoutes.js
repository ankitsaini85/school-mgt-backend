const express = require('express');
const {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  importStudents,
  bulkCreateStudents,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { studentValidation } = require('../validations/studentValidation');

const router = express.Router();

router.use(protect, authorize('teacher', 'principal'));
router.get('/', getStudents);
router.post('/', studentValidation, validate, createStudent);
router.post('/bulk', bulkCreateStudents);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.post('/import', importStudents);

module.exports = router;
