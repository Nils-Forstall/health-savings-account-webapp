import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://localhost:3001/api';

function App() {
  // State management
  const [currentView, setCurrentView] = useState('frontPage'); // frontPage, login, dashboard, hsaApplication
  const [user, setUser] = useState(null);
  const [hsaAccount, setHsaAccount] = useState(null);
  const [virtualCard, setVirtualCard] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    amount: '',
    merchant: '',
    description: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE}/users/login`, {
        email: formData.email,
        password: formData.password
      });

      setUser(response.data);
      setIsAuthenticated(true);
      setMessage('✅ Login successful!');
      
      try {
        const hsaResponse = await axios.get(`${API_BASE}/hsa/${response.data.userId}`);
        setHsaAccount(hsaResponse.data);
        setCurrentView('dashboard');
        fetchTransactionHistory();
      } catch (hsaError) {
        setCurrentView('hsaApplication');
      }
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.error || 'Login failed'));
    }
    
    setLoading(false);
  };

  // Step 1: Create User Account
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE}/users/create`, {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      setUser(response.data);
      setIsAuthenticated(true);
      setMessage('✅ User account created successfully!');
      
      try {
        const hsaResponse = await axios.post(`${API_BASE}/hsa/create`, {
          userId: response.data.userId
        });
        setHsaAccount(hsaResponse.data);
        setCurrentView('dashboard');
        fetchTransactionHistory();
      } catch (hsaError) {
        setCurrentView('hsaApplication');
      }
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.error || 'Failed to create user'));
    }
    
    setLoading(false);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE}/hsa/deposit`, {
        userId: user.userId,
        amount: parseFloat(formData.amount)
      });

      setHsaAccount(prev => ({ ...prev, balance: response.data.newBalance }));
      setMessage(`✅ Deposit successful! New balance: $${response.data.newBalance.toFixed(2)}`);
      setFormData(prev => ({ ...prev, amount: '' }));
      fetchTransactionHistory();
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.error || 'Deposit failed'));
    }
    
    setLoading(false);
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE}/hsa/withdraw`, {
        userId: user.userId,
        amount: parseFloat(formData.amount)
      });

      setHsaAccount(prev => ({ ...prev, balance: response.data.newBalance }));
      setMessage(`✅ Withdrawal successful! New balance: $${response.data.newBalance.toFixed(2)}`);
      setFormData(prev => ({ ...prev, amount: '' }));
      fetchTransactionHistory();
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.error || 'Withdrawal failed'));
    }
    
    setLoading(false);
  };

  const fetchTransactionHistory = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`${API_BASE}/hsa/transactions/${user.userId}`);
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
    }
  };

  // Step 2: Create HSA Account
  const handleCreateHSA = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE}/hsa/create`, {
        userId: user.userId
      });

      setHsaAccount(response.data);
      setMessage('✅ HSA account created successfully!');
      setCurrentView('dashboard');
      fetchTransactionHistory();
    } catch (error) {
      setMessage('❌ Failed to create HSA account');
    }
    
    setLoading(false);
  };

  // Step 3: Issue Virtual Card
  const handleIssueCard = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE}/card/issue`, {
        hsaAccountId: hsaAccount.hsaId
      });

      setVirtualCard(response.data);
      setMessage('✅ Virtual debit card issued successfully!');
    } catch (error) {
      setMessage('❌ Failed to issue card');
    }
    
    setLoading(false);
  };

  // Step 4: Process Transaction
  const handleTransaction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE}/transaction/process`, {
        cardNumber: virtualCard.cardNumber,
        amount: parseFloat(formData.amount),
        merchant: formData.merchant,
        description: formData.description
      });

      const result = response.data;
      if (result.status === 'APPROVED') {
        setMessage(`✅ Transaction APPROVED! New balance: $${result.newBalance.toFixed(2)}`);
        // Update local balance
        setHsaAccount(prev => ({ ...prev, balance: result.newBalance }));
      } else {
        setMessage(`❌ Transaction DECLINED: ${result.reason}`);
      }
    } catch (error) {
      setMessage('❌ Transaction failed');
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    setHsaAccount(null);
    setVirtualCard(null);
    setTransactions([]);
    setIsAuthenticated(false);
    setCurrentView('frontPage');
    setMessage('');
    setFormData({
      name: '',
      email: '',
      password: '',
      amount: '',
      merchant: '',
      description: ''
    });
  };

  const resetApp = () => {
    setCurrentView('frontPage');
    setUser(null);
    setHsaAccount(null);
    setVirtualCard(null);
    setTransactions([]);
    setIsAuthenticated(false);
    setMessage('');
    setFormData({
      name: '',
      email: '',
      password: '',
      amount: '',
      merchant: '',
      description: ''
    });
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
        {/* Front Page - Sign Up */}
        {currentView === 'frontPage' && (
          <div className="step-container">
            <h2>Create Your HSA Account</h2>
            <form onSubmit={handleCreateUser} className="form">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="primary-btn">
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
            <p style={{ marginTop: '1rem', color: '#666' }}>
              Already have an account?{' '}
              <button 
                onClick={() => setCurrentView('login')} 
                style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Log in
              </button>
            </p>
          </div>
        )}

        {/* Login Page */}
        {currentView === 'login' && (
          <div className="step-container">
            <h2>Log In</h2>
            <form onSubmit={handleLogin} className="form">
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="primary-btn">
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>
            <p style={{ marginTop: '1rem', color: '#666' }}>
              Don't have an account?{' '}
              <button 
                onClick={() => setCurrentView('frontPage')} 
                style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign up
              </button>
            </p>
          </div>
        )}

        {/* HSA Application */}
        {currentView === 'hsaApplication' && (
          <div className="step-container">
            <h2>Apply for HSA Account</h2>
            <div className="info-card">
              <h3>Welcome, {user?.name}!</h3>
              <p>You don't have an HSA account yet. Would you like to apply for one?</p>
              <p><small>HSAs provide tax advantages for medical expenses</small></p>
            </div>
            <button onClick={handleCreateHSA} disabled={loading} className="primary-btn">
              {loading ? 'Creating HSA...' : 'Apply for HSA Account'}
            </button>
          </div>
        )}

        {/* Dashboard */}
        {currentView === 'dashboard' && (
          <div className="step-container">
            <h2>HSA Dashboard</h2>
            
            {/* Account Info */}
            <div className="info-card">
              <h3>Welcome back, {user?.name}!</h3>
              <p><strong>Account Number:</strong> {hsaAccount?.account_number}</p>
              <p><strong>Current Balance:</strong> ${hsaAccount?.balance?.toFixed(2) || '0.00'}</p>
            </div>

            {/* Deposit/Withdraw Forms */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
              <div style={{ flex: 1 }}>
                <h3>Deposit Money</h3>
                <form onSubmit={handleDeposit} className="form">
                  <div className="form-group">
                    <label>Amount ($):</label>
                    <input
                      type="number"
                      name="amount"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading} className="primary-btn">
                    {loading ? 'Processing...' : 'Deposit'}
                  </button>
                </form>
              </div>
              
              <div style={{ flex: 1 }}>
                <h3>Withdraw Money</h3>
                <form onSubmit={handleWithdraw} className="form">
                  <div className="form-group">
                    <label>Amount ($):</label>
                    <input
                      type="number"
                      name="amount"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading} className="primary-btn">
                    {loading ? 'Processing...' : 'Withdraw'}
                  </button>
                </form>
              </div>
            </div>

            {/* Transaction History */}
            <div>
              <h3>Transaction History</h3>
              {transactions.length > 0 ? (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {transactions.map((transaction, index) => (
                    <div key={index} style={{ 
                      padding: '1rem', 
                      border: '1px solid #ddd', 
                      borderRadius: '8px', 
                      marginBottom: '0.5rem',
                      backgroundColor: transaction.status === 'APPROVED' ? '#f8f9fa' : '#fff5f5'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>{transaction.merchant}</strong></span>
                        <span style={{ color: transaction.amount > 0 ? 'green' : 'red' }}>
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        {transaction.description} • {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#666' }}>No transactions yet</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
