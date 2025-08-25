import React, { useState } from 'react';
import './App.css';
import SignUpForm from './components/auth/SignUpForm';
import LoginForm from './components/auth/LoginForm';
import HSAApplication from './components/hsa/HSAApplication';
import Dashboard from './components/dashboard/Dashboard';
import { hsaService } from './services/hsaService';

function App() {
  const [currentView, setCurrentView] = useState('frontPage');
  const [user, setUser] = useState(null);
  const [hsaAccount, setHsaAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchTransactionHistory = async () => {
    if (!user) return;
    
    try {
      const response = await hsaService.getTransactions(user.userId);
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
      fetchTransactionHistory();
    } catch (hsaError) {
      try {
        const newHsaAccount = await hsaService.createHSA(userData.userId);
        setHsaAccount(newHsaAccount);
        setCurrentView('dashboard');
        fetchTransactionHistory();
      } catch (createError) {
        setCurrentView('hsaApplication');
      }
    }
  };

  const handleHSACreated = (hsaData) => {
    setHsaAccount(hsaData);
    setCurrentView('dashboard');
    fetchTransactionHistory();
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
        <h1>🏥 HSA Web Application</h1>
        <p>Health Savings Account Management System</p>
        
        {isAuthenticated && (
          <button onClick={handleLogout} className="reset-btn" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
            Logout
          </button>
        )}
        
        {message && (
          <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </header>

      <main className="App-main">
        {currentView === 'frontPage' && (
          <SignUpForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setCurrentView('login')}
            setMessage={setMessage}
            setLoading={setLoading}
            loading={loading}
          />
        )}

        {currentView === 'login' && (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToSignUp={() => setCurrentView('frontPage')}
            setMessage={setMessage}
            setLoading={setLoading}
            loading={loading}
          />
        )}

        {currentView === 'hsaApplication' && (
          <HSAApplication
            user={user}
            onSuccess={handleHSACreated}
            setMessage={setMessage}
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
            setMessage={setMessage}
            setLoading={setLoading}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
}

export default App;
