import React from 'react';

const ChatList = ({ chats, selectedChat, onSelectChat, currentUser }) => {
  const getChatName = (chat) => {
    if (chat.isGroupChat) {
      return chat.chatName;
    }
    // For one-on-one chats, show the other user's name
    const otherUser = chat.users.find((user) => user._id !== currentUser._id);
    return otherUser ? otherUser.name : 'Unknown User';
  };

  const getChatAvatar = (chat) => {
    if (chat.isGroupChat) {
      return (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md ring-2 ring-purple-200">
          {chat.chatName.charAt(0).toUpperCase()}
        </div>
      );
    }
    const otherUser = chat.users.find((user) => user._id !== currentUser._id);
    if (otherUser?.avatar) {
      return (
        <img
          src={otherUser.avatar}
          alt={otherUser.name}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-200 shadow-md"
        />
      );
    }
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md ring-2 ring-purple-200">
        {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
      </div>
    );
  };

  const getLastMessage = (chat) => {
    if (chat.latestMessage) {
      const sender = chat.latestMessage.sender;
      const prefix = sender._id === currentUser._id ? 'You: ' : '';
      return prefix + chat.latestMessage.content;
    }
    return 'No messages yet';
  };

  const formatTime = (date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    const now = new Date();
    const diff = now - messageDate;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm font-medium">No chats yet</p>
          <p className="text-xs mt-1 text-gray-400">Start a new conversation!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {chats.map((chat, index) => (
            <div
              key={chat._id}
              onClick={() => onSelectChat(chat)}
              className={`p-4 cursor-pointer transition-all duration-200 animate-fadeIn ${
                selectedChat?._id === chat._id 
                  ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-l-4 border-purple-600 shadow-sm' 
                  : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50'
              }`}
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {getChatAvatar(chat)}
                  {!chat.isGroupChat && chat.users.find(u => u._id !== chat.users.find(u2 => u2._id === chat.users[0]?._id)?._id)?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-semibold truncate ${
                      selectedChat?._id === chat._id ? 'text-purple-900' : 'text-gray-900'
                    }`}>
                      {getChatName(chat)}
                    </p>
                    {chat.latestMessage && (
                      <span className="text-xs text-gray-500 font-medium">
                        {formatTime(chat.latestMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm truncate ${
                    selectedChat?._id === chat._id ? 'text-purple-700' : 'text-gray-600'
                  }`}>
                    {getLastMessage(chat)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatList;

