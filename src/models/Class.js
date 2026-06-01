const mongoose = require('mongoose');

const fundAllocationSchema = new mongoose.Schema(
  {
    fundName: { type: String, required: true, trim: true },
    percentage: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    feeSetup: {
      totalFee: { type: Number, default: 0, min: 0 },
      fundAllocations: { type: [fundAllocationSchema], default: [] },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Class', classSchema);
