const express = require('express');
const router = express.Router();
const { getChats, createChat, createGroupChat, getChat } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.get('/', getChats);
router.post('/', createChat);
router.post('/group', createGroupChat);
router.get('/:chatId', getChat);

module.exports = router;

