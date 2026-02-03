import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { messageAPI } from '../services/api';

const ChatWindow = ({ chat, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socket = getSocket();
  const typingTimeoutRef = useRef(null);

  // Monitor socket connection status
  useEffect(() => {
    if (!socket) {
      setSocketConnected(false);
      return;
    }

    const updateConnectionStatus = () => {
      setSocketConnected(socket.connected);
    };

    updateConnectionStatus();

    socket.on('connect', updateConnectionStatus);
    socket.on('disconnect', updateConnectionStatus);

    return () => {
      socket.off('connect', updateConnectionStatus);
      socket.off('disconnect', updateConnectionStatus);
    };
  }, [socket]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Define callbacks before using them in useEffect
  const loadMessages = useCallback(async () => {
    if (!chat?._id) return;

    try {
      setLoading(true);
      const response = await messageAPI.getMessages(chat._id);
      setMessages(response.data.data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [chat?._id]);

  const joinChat = useCallback(() => {
    if (socket && chat?._id) {
      if (socket.connected) {
        console.log('Joining chat room:', chat._id);
        socket.emit('join-chat', chat._id);
      } else {
        console.error('Socket not connected, cannot join chat');
      }
    }
  }, [socket, chat?._id]);

  const leaveChat = useCallback(() => {
    if (socket && chat?._id) {
      socket.emit('leave-chat', chat._id);
    }
  }, [socket, chat?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when chat changes
  useEffect(() => {
    if (chat?._id) {
      loadMessages();
      joinChat();
    }

    return () => {
      if (chat?._id) {
        leaveChat();
      }
    };
  }, [chat?._id, loadMessages, joinChat, leaveChat]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !chat?._id) {
      console.log('Socket or chat not available:', { socket: !!socket, chatId: chat?._id });
      return;
    }

    console.log('Setting up socket listeners for chat:', chat._id);

    const handleMessageReceived = (data) => {
      console.log('Message received:', data);
      if (data.chatId === chat._id) {
        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          const messageId = data.message?._id || data.message?.id;
          if (!messageId) {
            console.warn('Message without ID:', data.message);
            return prev;
          }
          
          const exists = prev.some((msg) => {
            const msgId = msg._id || msg.id;
            return msgId === messageId;
          });
          
          if (exists) {
            console.log('Duplicate message ignored:', messageId);
            return prev;
          }
          console.log('Adding new message:', messageId);
          return [...prev, data.message];
        });
      }
    };

    const handleMessageSent = (data) => {
      console.log('Message sent confirmation:', data);
      if (data.chatId === chat._id) {
        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          const messageId = data.message?._id || data.message?.id;
          if (!messageId) {
            console.warn('Message without ID:', data.message);
            return prev;
          }
          
          const exists = prev.some((msg) => {
            const msgId = msg._id || msg.id;
            return msgId === messageId;
          });
          
          if (exists) {
            console.log('Duplicate message ignored:', messageId);
            return prev;
          }
          console.log('Adding sent message:', messageId);
          return [...prev, data.message];
        });
      }
    };

    const handleTyping = (data) => {
      if (data.chatId === chat._id && data.userId !== currentUser._id) {
        setIsTyping(data.isTyping);
      }
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
      alert(`Error: ${error.message || 'Connection error'}`);
    };

    socket.on('message-received', handleMessageReceived);
    socket.on('message-sent', handleMessageSent);
    socket.on('typing', handleTyping);
    socket.on('error', handleError);

    return () => {
      console.log('Cleaning up socket listeners for chat:', chat._id);
      socket.off('message-received', handleMessageReceived);
      socket.off('message-sent', handleMessageSent);
      socket.off('typing', handleTyping);
      socket.off('error', handleError);
    };
  }, [socket, chat?._id, currentUser._id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !chat?._id) {
      return;
    }

    if (!socket) {
      console.error('Socket not connected');
      alert('Not connected to server. Please refresh the page.');
      return;
    }

    if (!socket.connected) {
      console.error('Socket not connected');
      alert('Connection lost. Please refresh the page.');
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      // Send via socket for real-time
      console.log('Sending message:', { chatId: chat._id, content: messageContent });
      socket.emit('new-message', {
        chatId: chat._id,
        content: messageContent,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleTyping = () => {
    if (!socket || !chat?._id) return;

    if (!typing) {
      setTyping(true);
      socket.emit('typing', { chatId: chat._id, isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      socket.emit('typing', { chatId: chat._id, isTyping: false });
    }, 1000);
  };

  const getChatName = () => {
    if (!chat) return '';
    if (chat.isGroupChat) {
      return chat.chatName;
    }
    const otherUser = chat.users.find((user) => user._id !== currentUser._id);
    return otherUser ? otherUser.name : 'Unknown User';
  };

  const getChatAvatar = () => {
    if (!chat) return null;
    if (chat.isGroupChat) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md ring-2 ring-purple-200">
          {chat.chatName.charAt(0).toUpperCase()}
        </div>
      );
    }
    const otherUser = chat.users.find((user) => user._id !== currentUser._id);
    if (otherUser?.avatar) {
      return (
        <div className="relative">
          <img
            src={otherUser.avatar}
            alt={otherUser.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-200 shadow-md"
          />
          {otherUser.isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          )}
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md ring-2 ring-purple-200">
        {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
      </div>
    );
  };

  if (!chat) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-200 to-indigo-300 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-700 mb-2">Select a chat to start messaging</p>
        <p className="text-sm text-gray-500">Choose a conversation from the sidebar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Chat Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          {getChatAvatar()}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{getChatName()}</h2>
            {isTyping && (
              <div className="flex items-center space-x-1 text-sm text-purple-600">
                <span className="w-1 h-1 bg-purple-600 rounded-full animate-pulse"></span>
                <span className="w-1 h-1 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1 h-1 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                <span className="ml-1 italic">typing...</span>
              </div>
            )}
          </div>
        </div>
        {!socketConnected && (
          <div className="flex items-center space-x-2 text-red-500 text-sm bg-red-50 px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="font-medium">Disconnected</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-transparent to-purple-50/30">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
              <p className="text-gray-500 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isOwn = message.sender?._id === currentUser._id || message.sender?.id === currentUser._id;
              const messageId = message._id || message.id || `msg-${index}`;
              return (
                <div
                  key={messageId}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl message-shadow transition-all duration-200 ${
                      isOwn
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                    }`}
                  >
                    {!isOwn && message.sender && (
                      <p className="text-xs font-semibold mb-1.5 opacity-90">
                        {message.sender.name || 'Unknown User'}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p
                      className={`text-xs mt-2 ${
                        isOwn ? 'text-purple-100' : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 px-6 py-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 bg-white/90 shadow-sm hover:shadow-md"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || !socketConnected}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none font-medium"
            title={!socketConnected ? 'Not connected to server' : ''}
          >
            {!socketConnected ? (
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                <span>Connecting...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <span>Send</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;

