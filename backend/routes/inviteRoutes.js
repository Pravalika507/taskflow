const express = require('express');
const { body } = require('express-validator');
const { sendInvite, acceptInvite, getTeamMembers, getMyInvitations, previewInvite } = require('../controllers/inviteController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public — no auth needed
router.get('/preview', previewInvite);

// Protected routes
router.use(protect);
router.post('/send', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail()
], sendInvite);
router.post('/accept', acceptInvite);
router.get('/team', getTeamMembers);
router.get('/sent', getMyInvitations);

module.exports = router;
