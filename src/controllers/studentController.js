const XLSX = require('xlsx');
const asyncHandler = require('../middlewares/asyncHandler');
const Student = require('../models/Student');
const User = require('../models/User');
const ClassModel = require('../models/Class');

const ensureTeacherClassAccess = async (user, classId) => {
  if (user.role === 'principal') return true;
  const teacher = await User.findById(user._id);
  return teacher.assignedClasses.some((assignedId) => assignedId.toString() === classId);
};

const getStudents = asyncHandler(async (req, res) => {
  const { classId, search = '' } = req.query;
  const query = {};

  if (classId) {
    const hasAccess = await ensureTeacherClassAccess(req.user, classId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot access this class' });
    }
    query.classId = classId;
  } else if (req.user.role === 'teacher') {
    const teacher = await User.findById(req.user._id).populate('assignedClasses');
    // combine assignedClasses and classes where teacherId is this teacher (to include older records)
    const assignedIds = (teacher.assignedClasses || []).map((c) => (c._id ? c._id : c));
    const extra = await ClassModel.find({ teacherId: req.user._id }).select('_id');
    const extraIds = extra.map((c) => c._id);
    const allIds = Array.from(new Set([...assignedIds.map(String), ...extraIds.map(String)])).map((id) => id);
    query.classId = { $in: allIds };
  }

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const students = await Student.find(query).populate('classId', 'name');
  res.json(students);
});

const createStudent = asyncHandler(async (req, res) => {
  const { name, classId } = req.body;
  const hasAccess = await ensureTeacherClassAccess(req.user, classId);
  if (!hasAccess) {
    return res.status(403).json({ message: 'You cannot manage this class' });
  }

  const teacherId = req.user.role === 'teacher' ? req.user._id : req.body.teacherId;
  const { caste = 'GENERAL', registrationStatus = 'registered' } = req.body;
  const student = await Student.create({ name, classId, teacherId, caste, registrationStatus });
  res.status(201).json(student);
});

const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  const hasAccess = await ensureTeacherClassAccess(req.user, student.classId.toString());
  if (!hasAccess) {
    return res.status(403).json({ message: 'You cannot manage this student' });
  }

  student.name = req.body.name ?? student.name;
  student.caste = req.body.caste ?? student.caste;
  student.registrationStatus = req.body.registrationStatus ?? student.registrationStatus;
  await student.save();
  res.json(student);
});

const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  const hasAccess = await ensureTeacherClassAccess(req.user, student.classId.toString());
  if (!hasAccess) {
    return res.status(403).json({ message: 'You cannot delete this student' });
  }

  await student.deleteOne();
  res.json({ message: 'Student deleted successfully' });
});

const importStudents = asyncHandler(async (req, res) => {
  const { classId, fileData } = req.body;
  const hasAccess = await ensureTeacherClassAccess(req.user, classId);
  if (!hasAccess) {
    return res.status(403).json({ message: 'You cannot manage this class' });
  }

  const workbook = XLSX.read(fileData, { type: 'base64' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

  const names = rows
    .flat()
    .map((value) => (value || '').toString().trim())
    .filter((value) => value && value.toLowerCase() !== 'student name');

  const payload = names.map((name) => ({ name, classId, teacherId: req.user._id }));
  const inserted = payload.length ? await Student.insertMany(payload) : [];

  res.status(201).json({
    preview: names,
    insertedCount: inserted.length,
  });
});

const bulkCreateStudents = asyncHandler(async (req, res) => {
  const { classId, students = [] } = req.body;
  const hasAccess = await ensureTeacherClassAccess(req.user, classId);
  if (!hasAccess) {
    return res.status(403).json({ message: 'You cannot manage this class' });
  }

  const payload = students
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') return { name: item.trim() };
      // assume object { name, caste, registrationStatus }
      return { name: (item.name || '').toString().trim(), caste: item.caste || 'GENERAL', registrationStatus: item.registrationStatus || 'registered' };
    })
    .filter((it) => it && it.name)
    .map((it) => ({ ...it, classId, teacherId: req.user._id }));

  const inserted = payload.length ? await Student.insertMany(payload) : [];
  res.status(201).json({ insertedCount: inserted.length, students: inserted });
});

module.exports = {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  importStudents,
  bulkCreateStudents,
};
