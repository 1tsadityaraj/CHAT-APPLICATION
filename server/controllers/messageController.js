const Message = require('../models/Message');
const Chat = require('../models/Chat');

/**
 * Get all messages for a chat
 * GET /api/messages/:chatId
 */
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        messages,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Create a new message
 * POST /api/messages
 */
const createMessage = async (req, res) => {
  try {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
      return res.status(400).json({
        success: false,
        message: 'Content and chat ID are required',
      });
    }

    // Create message
    const message = await Message.create({
      sender: req.user._id,
      content,
      chat: chatId,
      readBy: [req.user._id],
    });

    // Populate sender
    await message.populate('sender', 'name avatar');

    // Update chat's latest message
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message._id,
    });

    res.status(201).json({
      success: true,
      data: {
        message,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  getMessages,
  createMessage,
};

