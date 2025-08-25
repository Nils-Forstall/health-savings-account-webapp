import React, { useState } from 'react';
import './App.css';
import MultiStepSignup from './components/auth/MultiStepSignup';
import LoginForm from './components/auth/LoginForm';
import HSAApplication from './components/hsa/HSAApplication';
import Dashboard from './components/dashboard/Dashboard';
import Toast from './components/common/Toast';
import { hsaService } from './services/hsaService';

function App() {
  const [currentView, setCurrentView] = useState('frontPage');
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
      setCurrentView('dashboard');
      fetchTransactionHistory(userData);
    } catch (hsaError) {
      try {
        const newHsaAccount = await hsaService.createHSA(userData.userId);
        setHsaAccount(newHsaAccount);
        setCurrentView('dashboard');
        fetchTransactionHistory(userData);
      } catch (createError) {
        setCurrentView('hsaApplication');
      }
    }
  };

  const handleHSACreated = (hsaData) => {
    setHsaAccount(hsaData);
    setCurrentView('dashboard');
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
    setCurrentView('frontPage');
    setMessage('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🛡️ ForsShield</h1>
        <p>Your Health Savings Account Management Platform</p>
        
        {isAuthenticated && (
          <button onClick={handleLogout} className="reset-btn" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
            Logout
          </button>
        )}
        
      </header>

      <main className="App-main">
        {currentView === 'frontPage' && (
          <MultiStepSignup
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setCurrentView('login')}
            addToast={addToast}
            setLoading={setLoading}
            loading={loading}
          />
        )}

        {currentView === 'login' && (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToSignUp={() => setCurrentView('frontPage')}
            addToast={addToast}
            setLoading={setLoading}
            loading={loading}
          />
        )}

        {currentView === 'hsaApplication' && (
          <HSAApplication
            user={user}
            onSuccess={handleHSACreated}
            addToast={addToast}
            setLoading={setLoading}
            loading={loading}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            user={user}
            hsaAccount={hsaAccount}
            transactions={transactions}
            onBalanceUpdate={handleBalanceUpdate}
            onTransactionHistoryUpdate={fetchTransactionHistory}
            addToast={addToast}
            setLoading={setLoading}
            loading={loading}
          />
        )}
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

export default App;
