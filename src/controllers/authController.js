const asyncHandler = require('../middlewares/asyncHandler');
const User = require('../models/User');
const { generateToken } = require('../utils/token');

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username }).populate('assignedClasses');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  return res.json({
    token: generateToken(user._id, user.role),
    user,
  });
});

module.exports = { login };
