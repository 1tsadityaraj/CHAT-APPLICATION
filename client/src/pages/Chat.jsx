import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatAPI, userAPI } from '../services/api';
import { getSocket } from '../services/socket';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';

const Chat = () => {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchTimeoutRef = useRef(null);

  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getChats();
      setChats(response.data.data.chats);
      
      // Select first chat if available
      if (response.data.data.chats.length > 0 && !selectedChat) {
        setSelectedChat(response.data.data.chats[0]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedChat]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Listen for new messages to refresh chat list
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (data) => {
      // Refresh chat list when a new message is received
      loadChats();
      
      // If the message is for the currently selected chat, update it
      if (selectedChat && data.chatId === selectedChat._id) {
        // The ChatWindow component will handle the message display
        // But we should update the selectedChat to reflect latestMessage
        setSelectedChat((prev) => {
          if (prev && prev._id === data.chatId) {
            return {
              ...prev,
              latestMessage: data.message,
            };
          }
          return prev;
        });
      }
    };

    socket.on('message-received', handleNewMessage);
    socket.on('message-sent', handleNewMessage);

    return () => {
      socket.off('message-received', handleNewMessage);
      socket.off('message-sent', handleNewMessage);
    };
  }, [loadChats, selectedChat]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setSearchQuery(''); // Clear search when selecting a chat
    setSearchResults([]);
  };

  // Search users function
  const searchUsers = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      setSearchError('');
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError('');
      
      console.log('Searching for users with query:', query);
      const response = await userAPI.searchUsers(query.trim());
      
      console.log('Search response:', response);
      
      if (response && response.data && response.data.success) {
        const users = response.data.data?.users || [];
        console.log('Found users:', users.length);
        setSearchResults(users);
        if (users.length === 0) {
          setSearchError('No users found');
        }
      } else {
        const errorMsg = response?.data?.message || 'Failed to search users';
        console.error('Search failed:', errorMsg);
        setSearchError(errorMsg);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      let errorMessage = 'Failed to search users. Please try again.';
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Error in request setup
        errorMessage = error.message || 'Failed to search users';
      }
      
      setSearchError(errorMessage);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Handle search input change with debouncing
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search - wait 500ms after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        searchUsers(value);
      } else {
        setSearchResults([]);
        setSearchError('');
      }
    }, 500);
  };

  // Handle user selection from search results
  const handleSelectUser = useCallback(async (selectedUser) => {
    try {
      if (!selectedUser || !selectedUser._id) {
        setSearchError('Invalid user selected');
        return;
      }

      setSearchLoading(true);
      setSearchError('');

      // Create or fetch chat with selected user
      const response = await chatAPI.createChat(selectedUser._id);
      
      if (response.data.success && response.data.data.chat) {
        const chat = response.data.data.chat;

        // Update chats list if chat is new
        setChats((prevChats) => {
          const exists = prevChats.some((c) => c._id === chat._id);
          if (!exists) {
            return [chat, ...prevChats];
          }
          // Update existing chat if it exists
          return prevChats.map((c) => (c._id === chat._id ? chat : c));
        });

        // Select the chat
        setSelectedChat(chat);
        setSearchQuery(''); // Clear search
        setSearchResults([]); // Clear search results
        setSearchError(''); // Clear any errors
      } else {
        setSearchError(response.data.message || 'Failed to create chat');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error ||
        error.message ||
        'Failed to start chat. Please try again.';
      setSearchError(errorMessage);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Filter chats for display (when not searching)
  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    const chatName = chat.isGroupChat
      ? chat.chatName
      : chat.users.find((u) => u._id !== user._id)?.name || '';
    return chatName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              Chat Application
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white text-indigo-600 flex items-center justify-center font-semibold shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-medium">{user.name}</span>
            </div>
            <button
              onClick={logout}
              className="px-5 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden m-4 gap-4">
        {/* Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4 glass rounded-2xl shadow-xl flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search users or chats..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : searchQuery.trim() ? (
              // Show search results when searching
              <div className="h-full overflow-y-auto">
                {searchLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : searchError ? (
                  <div className="p-4 animate-fadeIn">
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-600 text-sm font-medium">Error</p>
                      </div>
                      <p className="text-red-500 text-sm mt-2">{searchError}</p>
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="animate-fadeIn">
                    <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200/50">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Search Results
                      </p>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {searchResults.map((searchUser, index) => (
                        <div
                          key={searchUser._id}
                          onClick={() => handleSelectUser(searchUser)}
                          className="p-4 cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200 animate-slideIn"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-center space-x-3">
                            {searchUser.avatar ? (
                              <img
                                src={searchUser.avatar}
                                alt={searchUser.name}
                                className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-200 shadow-md"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md ring-2 ring-purple-200">
                                {searchUser.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {searchUser.name}
                                </p>
                                {searchUser.isOnline && (
                                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate">
                                {searchUser.email}
                              </p>
                              {searchUser.isOnline && (
                                <p className="text-xs text-green-600 mt-1 font-medium">
                                  Online
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm">No users found</p>
                  </div>
                )}
              </div>
            ) : (
              // Show chat list when not searching
              <ChatList
                chats={filteredChats}
                selectedChat={selectedChat}
                onSelectChat={handleSelectChat}
                currentUser={user}
              />
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col glass rounded-2xl shadow-xl overflow-hidden">
          <ChatWindow chat={selectedChat} currentUser={user} />
        </div>
      </div>
    </div>
  );
};

export default Chat;

