const express = require('express');
const { searchUsers, inviteUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/search', searchUsers);
router.post('/invite', inviteUser);

module.exports = router;
