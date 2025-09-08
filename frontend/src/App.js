import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';

// Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import ProjectList from './components/Projects/ProjectList';
import ProjectDetail from './components/Projects/ProjectDetail';
import CreateProject from './components/Projects/CreateProject';
import Profile from './components/Profile/Profile';
import Navbar from './components/Layout/Navbar';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// API Configuration
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Add request interceptor to include auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {children}
    </div>
  );
};

// Main App Component
const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/projects" 
          element={
            <ProtectedRoute>
              <ProjectList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/projects/new" 
          element={
            <ProtectedRoute>
              <CreateProject />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/projects/:id" 
          element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 Route */}
        <Route 
          path="*" 
          element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-600 mb-4">Page not found</p>
                <a 
                  href="/dashboard" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </a>
              </div>
            </div>
          } 
        />
      </Routes>
    </Router>
  );
};

// Main App with Providers
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppRoutes />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
      </div>
    </AuthProvider>
  );
}

export default App;
