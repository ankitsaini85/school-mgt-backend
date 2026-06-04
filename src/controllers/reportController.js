const asyncHandler = require('../middlewares/asyncHandler');
const User = require('../models/User');
const ClassModel = require('../models/Class');
const Student = require('../models/Student');
const FeeRecord = require('../models/FeeRecord');
// const asyncHandler = require('../middlewares/asyncHandler');
// const User = require('../models/User');
// const ClassModel = require('../models/Class');
// const Student = require('../models/Student');
// const FeeRecord = require('../models/FeeRecord');
const { exportReportExcel, exportReportPdf } = require('../utils/reportExport');
const { normalizeFeeSetup } = require('../utils/feeSetup');

const getDashboard = asyncHandler(async (req, res) => {
  if (req.user.role === 'principal') {
    const [totalTeachers, totalClasses, totalStudents, totalFeeRecords] = await Promise.all([
      User.countDocuments({ role: 'teacher' }),
      ClassModel.countDocuments(),
      Student.countDocuments(),
      FeeRecord.countDocuments(),
    ]);

    return res.json({ totalTeachers, totalClasses, totalStudents, totalFeeRecords });
  }

  const [teacher, totalStudents] = await Promise.all([
    User.findById(req.user._id).populate('assignedClasses'),
    Student.countDocuments({ teacherId: req.user._id }),
  ]);

  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();
  const currentMonthCollection = await FeeRecord.countDocuments({
    teacherId: req.user._id,
    month: monthName,
    year,
    paymentMethod: { $in: ['cash', 'online'] },
  });

  return res.json({
    assignedClasses: (teacher.assignedClasses || []).map((classDoc) => ({
      ...classDoc.toObject(),
      feeSetup: normalizeFeeSetup(classDoc.feeSetup),
    })),
    totalStudents,
    currentMonthCollection,
  });
});

const getReports = asyncHandler(async (req, res) => {
  const { teacherId, classId, month, year, format } = req.query;
  const feeQuery = {};

  if (teacherId) feeQuery.teacherId = teacherId;
  if (classId) feeQuery.classId = classId;
  if (month) feeQuery.month = month;
  if (year) feeQuery.year = Number(year);

  if (req.user.role === 'teacher') {
    feeQuery.teacherId = req.user._id;
  }
  // If classId supplied, return per-student fund breakdown and totals (respecting caste map)
  if (classId) {
    const classDoc = await ClassModel.findById(classId).populate('teacherId', 'name');
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });

    const feeSetup = normalizeFeeSetup(classDoc.feeSetup || {});
    const fundAllocations = Array.isArray(feeSetup.fundAllocations) ? feeSetup.fundAllocations : [];
    const fundNames = fundAllocations.map((f) => f.fundName);

    // load students in class
    const students = await Student.find({ classId }).sort({ name: 1 });
    const studentIds = students.map((s) => s._id);

    // find fee records for these students (respect month/year filters if provided)
    const recordQuery = { classId, studentId: { $in: studentIds } };
    if (month) recordQuery.month = month;
    if (year) recordQuery.year = Number(year);
    const records = await FeeRecord.find(recordQuery);
    const feeByStudent = records.reduce((acc, r) => {
      acc[r.studentId.toString()] = r;
      return acc;
    }, {});

    // normalize caste map
    const fundCasteMap = classDoc.fundCasteMap ? (classDoc.fundCasteMap.toObject ? classDoc.fundCasteMap.toObject() : classDoc.fundCasteMap) : {};

    const rows = students.map((student) => {
      const caste = student.caste || 'GENERAL';
      const allowed = Array.isArray(fundCasteMap[caste]) ? fundCasteMap[caste] : fundNames;
      const allowedSet = new Set(allowed);

      const appliedAllocations = fundAllocations.filter((f) => allowedSet.has(f.fundName));
      const total = appliedAllocations.reduce((s, a) => s + Number(a.amount || 0), 0);

      const funds = fundAllocations.reduce((obj, f) => {
        obj[f.fundName] = allowedSet.has(f.fundName) ? Number(f.amount || 0) : 0;
        return obj;
      }, {});

      const record = feeByStudent[student._id.toString()];
      const paymentMethod = record?.paymentMethod || 'unpaid';

      return {
        studentId: student._id,
        studentName: student.name,
        caste,
        registrationStatus: student.registrationStatus || 'registered',
        classId: classDoc._id,
        className: classDoc.name,
        teacherName: classDoc.teacherId?.name || '',
        month: month || '',
        year: year ? Number(year) : '',
        paymentMethod,
        feeStatus: paymentMethod,
        total,
        funds,
      };
    });

    const paidTotal = rows.filter((r) => ['cash', 'online'].includes(r.paymentMethod)).reduce((s, r) => s + Number(r.total || 0), 0);

    const summary = {
      totalStudents: students.length,
      cashPaid: rows.filter((r) => r.paymentMethod === 'cash').length,
      onlinePaid: rows.filter((r) => r.paymentMethod === 'online').length,
      pending: rows.filter((r) => r.paymentMethod === 'unpaid').length,
      paidTotal,
    };

    if (format === 'excel') return exportReportExcel({ summary, rows, fundNames }, res);
    if (format === 'pdf') return exportReportPdf({ summary, rows, fundNames }, res);

    return res.json({ summary, rows, fundNames });
  }

  // fallback: generic fee-record based report
  const records = await FeeRecord.find(feeQuery)
    .populate('studentId', 'name')
    .populate('classId', 'name')
    .populate('teacherId', 'name');

  const rows = records.map((record) => ({
    studentName: record.studentId?.name || '-',
    className: record.classId?.name || '-',
    teacherName: record.teacherId?.name || '-',
    month: record.month,
    year: record.year,
    paymentMethod: record.paymentMethod,
    feeStatus: record.paymentMethod,
  }));

  const summary = {
    totalStudents: new Set(records.map((r) => r.studentId?._id?.toString())).size,
    cashPaid: records.filter((r) => r.paymentMethod === 'cash').length,
    onlinePaid: records.filter((r) => r.paymentMethod === 'online').length,
    pending: records.filter((r) => r.paymentMethod === 'unpaid').length,
  };

  if (format === 'excel') return exportReportExcel({ summary, rows }, res);
  if (format === 'pdf') return exportReportPdf({ summary, rows }, res);

  return res.json({ summary, rows });
});

module.exports = { getReports, getDashboard };

