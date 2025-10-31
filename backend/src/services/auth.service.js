const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

async function registerUser(name, email, password, role = 'buyer') {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);

  // Sanitize role
  const safeRole = role === 'retailer' ? 'retailer' : 'buyer';

  const user = await User.create({ name, email, password: hashedPassword, role: safeRole });

  const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

  return { token, user };
}

async function loginUser(email, password) {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid email or password');

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error('Invalid email or password');

  const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  return { token, user };
}

module.exports = { registerUser, loginUser };
