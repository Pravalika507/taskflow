const crypto = require('crypto');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const TeamMember = require('../models/TeamMember');
const { sendInvitationEmail } = require('../utils/email');
const { getTeamUsersForUser } = require('../utils/team');

const sendInvite = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const normalizedEmail = email.toLowerCase().trim();

    // Cannot invite yourself
    if (normalizedEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'You cannot invite yourself' });
    }

    // Check if already a team member
    const invitedUser = await User.findOne({ email: normalizedEmail });
    if (invitedUser) {
      const alreadyMember = await TeamMember.findOne({ owner: req.user._id, member: invitedUser._id });
      if (alreadyMember) {
        return res.status(400).json({ success: false, message: 'This person is already on your team' });
      }
    }

    // Check for existing pending invite
    const existing = await Invitation.findOne({ email: normalizedEmail, invitedBy: req.user._id, status: 'pending' });
    if (existing && existing.tokenExpire > Date.now()) {
      return res.status(400).json({ success: false, message: 'An invitation has already been sent to this email' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await Invitation.findOneAndUpdate(
      { email: normalizedEmail, invitedBy: req.user._id },
      {
        email: normalizedEmail,
        invitedBy: req.user._id,
        token: hashedToken,
        tokenExpire: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        status: 'pending',
        acceptedBy: null
      },
      { upsert: true, new: true }
    );

    await sendInvitationEmail(req.user.name, normalizedEmail, rawToken);

    res.json({ success: true, message: `Invitation sent to ${normalizedEmail}` });
  } catch (err) {
    console.error('Send invite error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send invitation' });
  }
};

const acceptInvite = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token is required' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const invitation = await Invitation.findOne({
      token: hashedToken,
      status: 'pending',
      tokenExpire: { $gt: Date.now() }
    }).populate('invitedBy', 'name email');

    if (!invitation) {
      return res.status(400).json({ success: false, message: 'Invitation link is invalid or has expired' });
    }

    // Accepting user must match invited email
    if (req.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: `This invitation was sent to ${invitation.email}. Please log in with that account to accept.`
      });
    }

    // Add bidirectional team membership
    await Promise.all([
      TeamMember.findOneAndUpdate(
        { owner: invitation.invitedBy._id, member: req.user._id },
        { owner: invitation.invitedBy._id, member: req.user._id },
        { upsert: true }
      ),
      TeamMember.findOneAndUpdate(
        { owner: req.user._id, member: invitation.invitedBy._id },
        { owner: req.user._id, member: invitation.invitedBy._id },
        { upsert: true }
      )
    ]);

    invitation.status = 'accepted';
    invitation.acceptedBy = req.user._id;
    await invitation.save();

    res.json({
      success: true,
      message: `You've joined ${invitation.invitedBy.name}'s team on TaskManager!`,
      invitedBy: invitation.invitedBy
    });
  } catch (err) {
    console.error('Accept invite error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to accept invitation' });
  }
};

const getTeamMembers = async (req, res) => {
  try {
    const teamUsers = await getTeamUsersForUser(req.user._id);

    res.json({
      success: true,
      data: teamUsers
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMyInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({ invitedBy: req.user._id })
      .populate('acceptedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: invitations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const previewInvite = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = await Invitation.findOne({ token: hashedToken })
      .populate('invitedBy', 'name');

    if (!invitation) return res.status(404).json({ success: false, message: 'Invitation not found or already used' });
    if (invitation.status === 'accepted') return res.status(400).json({ success: false, message: 'This invitation has already been accepted', code: 'ALREADY_ACCEPTED' });
    if (invitation.tokenExpire < Date.now()) return res.status(400).json({ success: false, message: 'This invitation link has expired', code: 'EXPIRED' });

    res.json({
      success: true,
      data: {
        inviterName: invitation.invitedBy?.name || 'Someone',
        invitedEmail: invitation.email,
        expiresAt: invitation.tokenExpire,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { sendInvite, acceptInvite, getTeamMembers, getMyInvitations, previewInvite };
