import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Create Auth Context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('user');
        
        if (!token || !savedUser) {
          setLoading(false);
          return;
        }

        // Verify token with backend
        const response = await axios.get('/auth/me');
        
        if (response.data.success) {
          setUser(response.data.data.user);
        } else {
          // Invalid token, clear storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Clear invalid tokens
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const response = await axios.post('/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        const { user: userData, token } = response.data.data;
        
        // Save to localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update state
        setUser(userData);
        
        toast.success('Login successful!');
        return { success: true };
      } else {
        toast.error('Login failed');
        return { success: false, message: 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      
      const response = await axios.post('/auth/register', userData);

      if (response.data.success) {
        const { user: newUser, token } = response.data.data;
        
        // Save to localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        // Update state
        setUser(newUser);
        
        toast.success('Registration successful!');
        return { success: true };
      } else {
        toast.error('Registration failed');
        return { success: false, message: 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    try {
      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Clear state
      setUser(null);
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/users/profile', profileData);
      
      if (response.data.success) {
        const updatedUser = response.data.data.user;
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update state
        setUser(updatedUser);
        
        toast.success('Profile updated successfully');
        return { success: true };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const response = await axios.post('/auth/refresh');
      
      if (response.data.success) {
        const { token } = response.data.data;
        localStorage.setItem('authToken', token);
        return { success: true };
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout(); // Force logout if refresh fails
      return { success: false };
    }
  };

  // Check if user has specific permissions
  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Basic permission check based on user type
    switch (permission) {
      case 'create_project':
        return user.userType === 'individual' || user.userType === 'company';
      case 'manage_company':
        return user.userType === 'company';
      default:
        return true;
    }
  };

  // Context value
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
    hasPermission,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
