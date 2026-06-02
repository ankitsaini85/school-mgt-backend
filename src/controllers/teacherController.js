const asyncHandler = require('../middlewares/asyncHandler');
const User = require('../models/User');
const ClassModel = require('../models/Class');
const { logAudit } = require('../utils/audit');

const getTeachers = asyncHandler(async (req, res) => {
  const teachers = await User.find({ role: 'teacher' }).populate('assignedClasses');
  res.json(teachers);
});

const createTeacher = asyncHandler(async (req, res) => {
  const { name, email, username, password, assignedClasses = [] } = req.body;

  const teacher = await User.create({
    name,
    email,
    username,
    password,
    role: 'teacher',
    assignedClasses,
  });

  if (assignedClasses.length) {
    await ClassModel.updateMany({ _id: { $in: assignedClasses } }, { teacherId: teacher._id });
  }

  await logAudit({
    userId: req.user._id,
    action: 'CREATE',
    entity: 'Teacher',
    entityId: teacher._id.toString(),
    details: { name: teacher.name },
  });

  res.status(201).json(await teacher.populate('assignedClasses'));
});

const updateTeacher = asyncHandler(async (req, res) => {
  const { name, email, username, password, assignedClasses = [] } = req.body;
  const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });

  if (!teacher) {
    return res.status(404).json({ message: 'Teacher not found' });
  }

  teacher.name = name ?? teacher.name;
  teacher.email = email ?? teacher.email;
  teacher.username = username ?? teacher.username;
  teacher.assignedClasses = assignedClasses;
  if (password) teacher.password = password;

  await teacher.save();
  await ClassModel.updateMany({ teacherId: teacher._id }, { $set: { teacherId: null } });
  if (assignedClasses.length) {
    await ClassModel.updateMany({ _id: { $in: assignedClasses } }, { teacherId: teacher._id });
  }

  await logAudit({
    userId: req.user._id,
    action: 'UPDATE',
    entity: 'Teacher',
    entityId: teacher._id.toString(),
    details: { name: teacher.name },
  });

  res.json(await teacher.populate('assignedClasses'));
});

const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
  if (!teacher) {
    return res.status(404).json({ message: 'Teacher not found' });
  }

  await ClassModel.updateMany({ teacherId: teacher._id }, { $set: { teacherId: null } });
  await teacher.deleteOne();

  await logAudit({
    userId: req.user._id,
    action: 'DELETE',
    entity: 'Teacher',
    entityId: req.params.id,
  });

  res.json({ message: 'Teacher deleted successfully' });
});

module.exports = { getTeachers, createTeacher, updateTeacher, deleteTeacher };
