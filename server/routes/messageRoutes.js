const express = require('express');
const router = express.Router();
const { getMessages, createMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.get('/:chatId', getMessages);
router.post('/', createMessage);

module.exports = router;

