import React, { useState } from 'react';
import './App.css';
import MultiStepSignup from './components/auth/MultiStepSignup';
import LoginForm from './components/auth/LoginForm';
import HSAApplication from './components/hsa/HSAApplication';
import Dashboard from './components/dashboard/Dashboard';
import CardSimulatorPage from './components/simulator/CardSimulatorPage';
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>🛡️ ForsShield</h1>
            <p>Your Health Savings Account Management Platform</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {currentView !== 'cardSimulator' && (
              <button 
                onClick={() => setCurrentView('cardSimulator')}
                style={{
                  background: '#007bff',
                  color: 'white',
                  padding: '0.75rem 1.25rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                💳 Simulate Transaction
              </button>
            )}
            {isAuthenticated && currentView !== 'dashboard' && (
              <button 
                onClick={() => setCurrentView('dashboard')}
                style={{
                  background: '#28a745',
                  color: 'white',
                  padding: '0.75rem 1.25rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                🏠 Dashboard
              </button>
            )}
          </div>
        </div>
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
            onLogout={handleLogout}
          />
        )}

        {currentView === 'cardSimulator' && (
          <CardSimulatorPage
            addToast={addToast}
            setLoading={setLoading}
            loading={loading}
            onBackToHome={() => setCurrentView(isAuthenticated ? 'dashboard' : 'frontPage')}
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
