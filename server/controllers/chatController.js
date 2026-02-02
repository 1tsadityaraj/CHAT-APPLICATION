const Chat = require('../models/Chat');
const User = require('../models/User');

/**
 * Get all chats for the authenticated user
 * GET /api/chats
 */
const getChats = async (req, res) => {
  try {
    console.log('Getting chats for user:', req.user._id);
    
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .sort({ updatedAt: -1 })
      .populate('users', 'name email avatar isOnline')
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'sender',
          select: 'name avatar',
        },
      })
      .populate('groupAdmin', 'name email avatar');

    console.log(`Found ${chats.length} chats for user ${req.user._id}`);

    res.status(200).json({
      success: true,
      data: {
        chats,
      },
    });
  } catch (error) {
    console.error('Error getting chats:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Create or fetch one-on-one chat
 * POST /api/chats
 */
const createChat = async (req, res) => {
  try {
    const { userId } = req.body;

    console.log('Creating chat request:', { userId, currentUserId: req.user._id });

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Validate that userId is not the same as current user
    if (userId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create chat with yourself',
      });
    }

    // Verify the target user exists
    const User = require('../models/User');
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if chat already exists
    let existingChats = await Chat.find({
      isGroupChat: false,
      users: { $all: [req.user._id, userId] },
    })
      .populate('users', 'name email avatar isOnline')
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'sender',
          select: 'name avatar',
        },
      })
      .exec();

    if (existingChats.length > 0) {
      console.log('Existing chat found:', existingChats[0]._id);
      return res.status(200).json({
        success: true,
        data: {
          chat: existingChats[0],
        },
      });
    }

    // Create new chat
    const chatData = {
      chatName: 'sender',
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    console.log('Creating new chat with data:', chatData);
    const createdChat = await Chat.create(chatData);
    console.log('Chat created:', createdChat._id);

    const fullChat = await Chat.findOne({ _id: createdChat._id })
      .populate('users', 'name email avatar isOnline')
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'sender',
          select: 'name avatar',
        },
      })
      .exec();

    console.log('Chat populated successfully');

    res.status(201).json({
      success: true,
      data: {
        chat: fullChat,
      },
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Create group chat
 * POST /api/chats/group
 */
const createGroupChat = async (req, res) => {
  try {
    const { chatName, users } = req.body;

    if (!chatName || !users) {
      return res.status(400).json({
        success: false,
        message: 'Chat name and users are required',
      });
    }

    if (users.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Group chat must have at least 2 users',
      });
    }

    // Add current user to users array
    users.push(req.user._id);

    const groupChat = await Chat.create({
      chatName,
      users,
      isGroupChat: true,
      groupAdmin: req.user._id,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate('users', 'name email avatar isOnline')
      .populate('groupAdmin', 'name email avatar');

    res.status(201).json({
      success: true,
      data: {
        chat: fullGroupChat,
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
 * Get single chat by ID
 * GET /api/chats/:chatId
 */
const getChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate('users', 'name email avatar isOnline')
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'sender',
          select: 'name avatar',
        },
      })
      .populate('groupAdmin', 'name email avatar')
      .exec();

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        chat,
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
  getChats,
  createChat,
  createGroupChat,
  getChat,
};

