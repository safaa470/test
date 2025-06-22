import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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

  useEffect(() => {
    // Use sessionStorage instead of localStorage for session-based storage
    // sessionStorage is automatically cleared when the browser/tab is closed
    const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('user');
    
    if (token && userData) {
      // Verify token is still valid by making a test API call
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Test the token with a simple API call
      axios.get('/api/dashboard/stats')
        .then(() => {
          // Token is valid, set user
          setUser(JSON.parse(userData));
        })
        .catch(() => {
          // Token is invalid, clear it
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });

      const { token, user } = response.data;
      
      // Store in sessionStorage instead of localStorage
      // This ensures tokens are cleared when browser is closed
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const logout = () => {
    // Clear session storage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    // Also clear any localStorage items (cleanup)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};