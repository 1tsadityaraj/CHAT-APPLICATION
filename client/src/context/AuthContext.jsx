import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Initialize socket connection
          const socketInstance = initSocket(storedToken);
          
          // Wait for socket to connect
          if (socketInstance) {
            socketInstance.on('connect', () => {
              console.log('Socket connected on auth check');
            });
          }
        } catch (error) {
          console.error('Error checking auth:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Register user
  const register = async (formData) => {
    try {
      const response = await authAPI.register(formData);
      const { user: userData, token: authToken } = response.data.data;

      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);

      // Initialize socket connection
      initSocket(authToken);

      return { success: true, data: userData };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error ||
        error.message ||
        'Registration failed. Please check your connection and try again.';
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      const response = await authAPI.login(formData);
      const { user: userData, token: authToken } = response.data.data;

      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);

      // Initialize socket connection
      initSocket(authToken);

      return { success: true, data: userData };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error ||
        error.message ||
        'Login failed. Please check your credentials and try again.';
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

