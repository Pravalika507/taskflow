const crypto = require('crypto');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/email');

// GET /api/users/search?q=email-or-name
const searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { email: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    })
      .select('name email isVerified')
      .limit(10);

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/users/invite  { email, name? }
// Invites a user by email — creates an unverified account if they don't exist,
// sends them a verification/invite email so they can set a password and join.
const inviteUser = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      // Already exists — return their info so caller can add them as member
      return res.json({
        success: true,
        alreadyExists: true,
        data: { _id: user._id, name: user.name, email: user.email, isVerified: user.isVerified }
      });
    }

    // Create placeholder account with random password
    const tempPassword = crypto.randomBytes(16).toString('hex');
    user = await User.create({
      name: name || email.split('@')[0],
      email: email.toLowerCase().trim(),
      password: tempPassword,
      isVerified: false
    });

    // Send invite/verification email
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.emailVerificationExpire = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    await user.save({ validateBeforeSave: false });

    try {
      await sendVerificationEmail(user.name, user.email, verificationToken);
    } catch (emailErr) {
      console.error('Invite email failed:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      alreadyExists: false,
      data: { _id: user._id, name: user.name, email: user.email, isVerified: false }
    });
  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { searchUsers, inviteUser };
