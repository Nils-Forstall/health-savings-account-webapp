import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import Navigation from './components/common/Navigation';
import ProtectedRoute from './components/routes/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HSAApplicationPage from './pages/HSAApplicationPage';
import SimulatorPage from './pages/SimulatorPage';
import Toast from './components/common/Toast';
import { hsaService } from './services/hsaService';

function AppContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hsaAccount, setHsaAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [toasts, setToasts] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const fetchTransactionHistory = async (userData = user) => {
    if (!userData) return;
    
    try {
      const response = await hsaService.getTransactions(userData.userId);
      setTransactions(response.transactions);
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
    }
  };

  const handleAuthSuccess = async (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    
    try {
      const hsaData = await hsaService.getHSA(userData.userId);
      setHsaAccount(hsaData);
      navigate('/dashboard');
      fetchTransactionHistory(userData);
    } catch (hsaError) {
      try {
        const newHsaAccount = await hsaService.createHSA(userData.userId);
        setHsaAccount(newHsaAccount);
        navigate('/dashboard');
        fetchTransactionHistory(userData);
      } catch (createError) {
        navigate('/hsa-application');
      }
    }
  };

  const handleHSACreated = (hsaData) => {
    setHsaAccount(hsaData);
    navigate('/dashboard');
    fetchTransactionHistory(user);
  };

  const handleBalanceUpdate = (newBalance) => {
    setHsaAccount(prev => ({ ...prev, balance: newBalance }));
  };

  const handleLogout = () => {
    setUser(null);
    setHsaAccount(null);
    setTransactions([]);
    setIsAuthenticated(false);
    setMessage('');
    navigate('/');
  };

  return (
    <div className="App">
      <Navigation isAuthenticated={isAuthenticated} onLogout={handleLogout} />

      <main className="App-main">
        <Routes>
          <Route path="/" element={
            <HomePage
              onAuthSuccess={handleAuthSuccess}
              addToast={addToast}
              setLoading={setLoading}
              loading={loading}
            />
          } />
          
          <Route path="/login" element={
            <LoginPage
              onAuthSuccess={handleAuthSuccess}
              addToast={addToast}
              setLoading={setLoading}
              loading={loading}
            />
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <DashboardPage
                user={user}
                hsaAccount={hsaAccount}
                transactions={transactions}
                onBalanceUpdate={handleBalanceUpdate}
                onTransactionHistoryUpdate={fetchTransactionHistory}
                addToast={addToast}
                setLoading={setLoading}
                loading={loading}
              />
            </ProtectedRoute>
          } />
          
          <Route path="/hsa-application" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <HSAApplicationPage
                user={user}
                onSuccess={handleHSACreated}
                addToast={addToast}
                setLoading={setLoading}
                loading={loading}
              />
            </ProtectedRoute>
          } />
          
          <Route path="/simulator" element={
            <SimulatorPage
              addToast={addToast}
              setLoading={setLoading}
              loading={loading}
              isAuthenticated={isAuthenticated}
            />
          } />
          
          {/* Redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
