const mongoose = require('mongoose');

/**
 * Chat Schema
 * Supports both one-to-one and group chats
 */
const chatSchema = new mongoose.Schema(
  {
    chatName: {
      type: String,
      trim: true,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Populate users and latest message
 */
chatSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'users',
    select: 'name email avatar isOnline',
  }).populate({
    path: 'latestMessage',
    populate: {
      path: 'sender',
      select: 'name avatar',
    },
  });

  if (typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.model('Chat', chatSchema);

