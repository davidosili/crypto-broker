const User = require('../models/User');

exports.requireLogin = (req, res, next) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.user = req.session.user; // <-- Add this line
  next();
};

exports.requireAdmin = async (req, res, next) => {
  try {
    const sessionUser = req.session.user;

    if (!sessionUser || sessionUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    // Optionally verify user in DB
    const user = await User.findById(sessionUser.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    next();
  } catch (err) {
    console.error('Admin check error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
