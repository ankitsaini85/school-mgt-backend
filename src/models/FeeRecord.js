const mongoose = require('mongoose');

const feeRecordSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['cash', 'online', 'unpaid'], default: 'unpaid' },
  },
  { timestamps: true }
);

feeRecordSchema.index({ studentId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('FeeRecord', feeRecordSchema);
