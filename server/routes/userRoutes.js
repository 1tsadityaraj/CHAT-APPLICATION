const express = require('express');
const router = express.Router();
const { searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Search users
router.get('/', searchUsers);

module.exports = router;

