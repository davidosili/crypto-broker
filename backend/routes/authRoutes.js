const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // your User model
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.getUser);

// ✅ Configure Passport
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,   // from Google Cloud
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Find existing user
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
            // Create new user
            user = new User({
                username: profile.displayName,
                email: profile.emails[0].value,
                password: null,  // no password needed
                role: 'user'
            });
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

// Serialize/deserialize user
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

// ✅ Google login route
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// ✅ Google callback
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/frontend/register.html' }),
    (req, res) => {
        // Redirect based on role
        if (req.user.role === 'admin') {
            res.redirect('/frontend/admin.html');
        } else {
            res.redirect('/frontend/dashboard.html');
        }
    }
);

module.exports = router;
