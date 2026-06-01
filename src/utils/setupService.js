const User = require('../models/User');
const ClassModel = require('../models/Class');
const Student = require('../models/Student');
const FeeRecord = require('../models/FeeRecord');

const fundNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'Others'];

const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.toLocaleString('default', { month: 'long' }),
    year: now.getFullYear(),
  };
};

const buildDemoFeeSetup = (totalFee, fundPercentages) => {
  const primaryPercentages = fundPercentages.slice(0, 8).map((value) => Number(value || 0));
  const primaryAllocations = fundNames.slice(0, 8).map((fundName, index) => {
    const percentage = primaryPercentages[index];
    return {
      fundName,
      percentage,
      amount: Number(((totalFee * percentage) / 100).toFixed(2)),
    };
  });

  const othersInput = fundPercentages[8];
  const primaryTotal = primaryAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);
  const derivedOthersAmount = Number(Math.max(totalFee - primaryTotal, 0).toFixed(2));
  const derivedOthersPercentage = totalFee ? Number(((derivedOthersAmount / totalFee) * 100).toFixed(2)) : 0;
  const othersPercentage = othersInput === null || othersInput === undefined || othersInput === ''
    ? derivedOthersPercentage
    : Number(othersInput || 0);
  const othersAmount = othersInput === null || othersInput === undefined || othersInput === ''
    ? derivedOthersAmount
    : Number(((totalFee * othersPercentage) / 100).toFixed(2));

  return {
    totalFee,
    fundAllocations: [
      ...primaryAllocations,
      {
        fundName: 'Others',
        percentage: othersPercentage,
        amount: othersAmount,
      },
    ],
    updatedAt: new Date(),
  };
};

const getSetupStatus = async () => {
  const principalCount = await User.countDocuments({ role: 'principal' });
  return {
    initialized: principalCount > 0,
    principalCount,
  };
};

const createPrincipalAccount = async ({ name, email, username, password }) => {
  const existingByEmail = await User.findOne({ email });
  if (existingByEmail) {
    throw new Error('Principal email already exists');
  }

  const existingByUsername = await User.findOne({ username });
  if (existingByUsername) {
    throw new Error('Principal username already exists');
  }

  return User.create({
    name,
    email,
    username,
    password,
    role: 'principal',
  });
};

const seedDemoData = async () => {
  const teacherBlueprint = [
    {
      name: 'Rahul Sharma',
      email: 'rahul.teacher@demo.school',
      username: 'rahul.teacher',
      password: 'teacher123',
      classes: ['Class 5', 'Class 6'],
      students: ['Rahul', 'Mohit', 'Ankit', 'Priya', 'Riya'],
    },
    {
      name: 'Neha Verma',
      email: 'neha.teacher@demo.school',
      username: 'neha.teacher',
      password: 'teacher123',
      classes: ['Class 7'],
      students: ['Aman', 'Sonal', 'Vikas', 'Kriti', 'Harsh'],
    },
  ];

  const demoFeeBlueprint = {
    'Class 5': buildDemoFeeSetup(900, [5, 2, 1, 1, 1, 0.5, 0.5, 0]),
    'Class 6': buildDemoFeeSetup(950, [4, 2, 1, 1, 0.5, 0.5, 0.5, 0.5]),
    'Class 7': buildDemoFeeSetup(980, [20, 15, 10, 10, 10, 10, 5, 15, 5]),
  };

  const { month, year } = getCurrentMonthYear();

  for (const blueprint of teacherBlueprint) {
    let teacher = await User.findOne({ username: blueprint.username, role: 'teacher' });

    if (!teacher) {
      teacher = await User.create({
        name: blueprint.name,
        email: blueprint.email,
        username: blueprint.username,
        password: blueprint.password,
        role: 'teacher',
      });
    }

    const assignedClassIds = [];

    for (const className of blueprint.classes) {
      let classDoc = await ClassModel.findOne({ name: className });
      if (!classDoc) {
        classDoc = await ClassModel.create({ name: className, teacherId: teacher._id });
      } else {
        classDoc.teacherId = teacher._id;
        await classDoc.save();
      }

      if (demoFeeBlueprint[className]) {
        classDoc.feeSetup = demoFeeBlueprint[className];
        await classDoc.save();
      }

      assignedClassIds.push(classDoc._id);

      for (const studentName of blueprint.students) {
        const fullStudentName = `${studentName} ${className}`;
        let student = await Student.findOne({ name: fullStudentName, classId: classDoc._id });

        if (!student) {
          student = await Student.create({
            name: fullStudentName,
            classId: classDoc._id,
            teacherId: teacher._id,
          });
        }

        const paymentMethodPool = ['cash', 'online', 'unpaid'];
        const paymentMethod = paymentMethodPool[(studentName.length + className.length) % paymentMethodPool.length];

        await FeeRecord.updateOne(
          {
            studentId: student._id,
            classId: classDoc._id,
            month,
            year,
          },
          {
            $set: {
              teacherId: teacher._id,
              paymentMethod,
            },
          },
          { upsert: true }
        );
      }
    }

    teacher.assignedClasses = assignedClassIds;
    await teacher.save();
  }

  return { seeded: true };
};

module.exports = {
  getSetupStatus,
  createPrincipalAccount,
  seedDemoData,
};
