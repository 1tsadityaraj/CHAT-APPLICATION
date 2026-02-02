const mongoose = require('mongoose');

/**
 * Message Schema
 * Stores individual messages in chats
 */
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      required: [true, 'Message content is required'],
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * Populate sender information
 */
messageSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'sender',
    select: 'name avatar',
  });

  if (typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.model('Message', messageSchema);

