const asyncHandler = require('../middlewares/asyncHandler');
const ClassModel = require('../models/Class');
const User = require('../models/User');
const { buildFeeSetup, normalizeFeeSetup } = require('../utils/feeSetup');

const serializeClass = (classDoc) => {
  const obj = classDoc.toObject({ flattenMaps: true });
  return {
    ...obj,
    feeSetup: normalizeFeeSetup(obj.feeSetup),
    fundCasteMap: obj.fundCasteMap || {},
  };
};

const getClasses = asyncHandler(async (req, res) => {
  if (req.user.role === 'teacher') {
    const teacher = await User.findById(req.user._id).populate('assignedClasses');
    // Collect class ids from assignedClasses and classes where teacherId matches
    const assignedIds = (teacher.assignedClasses || []).map((c) => (c._id ? c._id : c));
    const extra = await ClassModel.find({ teacherId: req.user._id }).select('_id');
    const extraIds = extra.map((c) => c._id);
    const allIds = Array.from(new Set([...assignedIds.map(String), ...extraIds.map(String)])).map((id) => id);
    const classDocs = await ClassModel.find({ _id: { $in: allIds } }).populate('teacherId', 'name email username');
    return res.json(classDocs.map(serializeClass));
  }

  const classes = await ClassModel.find().populate('teacherId', 'name email username');
  return res.json(classes.map(serializeClass));
});

const createClass = asyncHandler(async (req, res) => {
  const { name, teacherId } = req.body;
  const classDoc = await ClassModel.create({ name, teacherId: teacherId || null });

  if (teacherId) {
    await User.findByIdAndUpdate(teacherId, { $addToSet: { assignedClasses: classDoc._id } });
  }

  res.status(201).json(classDoc);
});

const updateClassFeeSetup = asyncHandler(async (req, res) => {
  const classDoc = await ClassModel.findById(req.params.id);

  if (!classDoc) {
    return res.status(404).json({ message: 'Class not found' });
  }

  const { totalFee, fundPercentages } = req.body;
  classDoc.feeSetup = buildFeeSetup(totalFee, fundPercentages, req.user._id);

  await classDoc.save();

  res.json(serializeClass(classDoc));
});

const updateClassFundCasteMap = asyncHandler(async (req, res) => {
  const classDoc = await ClassModel.findById(req.params.id);
  if (!classDoc) return res.status(404).json({ message: 'Class not found' });

  const { fundCasteMap } = req.body;
  // Expect fundCasteMap to be an object like { SC: ['A','B'], OBC: [...], GENERAL: [...] }
  classDoc.fundCasteMap = fundCasteMap || {};
  await classDoc.save();
  res.json(serializeClass(classDoc));
});

module.exports = { getClasses, createClass, updateClassFeeSetup, updateClassFundCasteMap };
