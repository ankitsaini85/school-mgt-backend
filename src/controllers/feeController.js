const asyncHandler = require('../middlewares/asyncHandler');
const Student = require('../models/Student');
const FeeRecord = require('../models/FeeRecord');
const User = require('../models/User');

const getFees = asyncHandler(async (req, res) => {
  const { classId, month, year, page = 1, limit = 20, search = '' } = req.query;
  if (!classId || !month || !year) {
    return res.status(400).json({ message: 'classId, month and year are required' });
  }

  if (req.user.role === 'teacher') {
    const teacher = await User.findById(req.user._id);
    if (!teacher.assignedClasses.some((id) => id.toString() === classId)) {
      return res.status(403).json({ message: 'You cannot access this class' });
    }
  }

  const studentQuery = { classId };
  if (search) studentQuery.name = { $regex: search, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const [students, total] = await Promise.all([
    Student.find(studentQuery).sort({ name: 1 }).skip(skip).limit(Number(limit)),
    Student.countDocuments(studentQuery),
  ]);

  const studentIds = students.map((s) => s._id);
  const records = await FeeRecord.find({
    studentId: { $in: studentIds },
    classId,
    month,
    year: Number(year),
  });

  const feeByStudent = records.reduce((acc, record) => {
    acc[record.studentId.toString()] = record;
    return acc;
  }, {});

  const rows = students.map((student) => {
    const fee = feeByStudent[student._id.toString()];
    return {
      studentId: student._id,
      studentName: student.name,
      caste: student.caste || 'GENERAL',
      registrationStatus: student.registrationStatus || 'registered',
      paymentMethod: fee?.paymentMethod || 'unpaid',
    };
  });

  res.json({ rows, total, page: Number(page), limit: Number(limit) });
});

const bulkUpdateFees = asyncHandler(async (req, res) => {
  const { classId, month, year, updates = [] } = req.body;
  if (!classId || !month || !year) {
    return res.status(400).json({ message: 'classId, month and year are required' });
  }

  if (req.user.role === 'teacher') {
    const teacher = await User.findById(req.user._id);
    if (!teacher.assignedClasses.some((id) => id.toString() === classId)) {
      return res.status(403).json({ message: 'You cannot update this class' });
    }
  }

  const validUpdates = updates.filter(
    (item) => item.studentId && ['cash', 'online', 'unpaid'].includes(item.paymentMethod)
  );

  if (!validUpdates.length) {
    return res.json({ modifiedCount: 0, message: 'No valid changes to save' });
  }

  const operations = validUpdates.map((item) => ({
    updateOne: {
      filter: {
        studentId: item.studentId,
        classId,
        month,
        year: Number(year),
      },
      update: {
        $set: {
          teacherId: req.user._id,
          paymentMethod: item.paymentMethod,
        },
      },
      upsert: true,
    },
  }));

  const result = await FeeRecord.bulkWrite(operations, { ordered: false });
  res.json({
    modifiedCount: (result.modifiedCount || 0) + (result.upsertedCount || 0),
    matchedCount: result.matchedCount || 0,
  });
});

module.exports = { getFees, bulkUpdateFees };
