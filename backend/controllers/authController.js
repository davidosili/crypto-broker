const User = require('../models/User');
const bcrypt = require('bcrypt');


exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'User exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    await user.save();

    // ✅ Save full user object in session (same as login)
    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role
    };

    res.status(201).json({
      message: 'Registered successfully',
      user: req.session.user
    });
  } catch (err) {
    console.error('❌ Register error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
};


exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    // Check if user is active (optional, if your User model has an 'active' field)
    // if (user.active === false) return res.status(403).json({ message: 'Account disabled' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    // ✅ Save full user object in session
    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role
    };

    res.json({ message: 'Login successful', user: req.session.user });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
  console.log('Session after login:', req.session);

};





exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logged out' });
  });
};

exports.getUser = (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });

  res.json({ user: req.session.user });
};
