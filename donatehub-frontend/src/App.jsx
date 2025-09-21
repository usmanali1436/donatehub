import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navigation from './components/common/Navigation';

// Auth components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Page components (to be created)
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CampaignList from './pages/CampaignList';
import CampaignDetail from './pages/CampaignDetail';
import MyCampaigns from './pages/MyCampaigns';
import MyDonations from './pages/MyDonations';
import Profile from './pages/Profile';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes with navigation */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Navigation />
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/campaigns" element={
              <ProtectedRoute>
                <Navigation />
                <CampaignList />
              </ProtectedRoute>
            } />
            
            <Route path="/campaigns/:id" element={
              <ProtectedRoute>
                <Navigation />
                <CampaignDetail />
              </ProtectedRoute>
            } />
            
            {/* Checkout routes */}
            <Route path="/checkout" element={
              <ProtectedRoute requiredRole="donor">
                <Navigation />
                <CheckoutPage />
              </ProtectedRoute>
            } />
            
            <Route path="/checkout/success" element={
              <ProtectedRoute requiredRole="donor">
                <Navigation />
                <CheckoutSuccessPage />
              </ProtectedRoute>
            } />
            
            {/* NGO-only routes */}
            <Route path="/my-campaigns" element={
              <ProtectedRoute requiredRole="ngo">
                <Navigation />
                <MyCampaigns />
              </ProtectedRoute>
            } />
            
            {/* Donor-only routes */}
            <Route path="/donations" element={
              <ProtectedRoute requiredRole="donor">
                <Navigation />
                <MyDonations />
              </ProtectedRoute>
            } />
            
            {/* Common protected routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Navigation />
                <Profile />
              </ProtectedRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;