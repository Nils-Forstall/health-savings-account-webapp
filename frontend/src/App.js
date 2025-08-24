import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://localhost:3001/api';

function App() {
  // State management
  const [currentStep, setCurrentStep] = useState('register'); // register, hsa, card, transaction
  const [user, setUser] = useState(null);
  const [hsaAccount, setHsaAccount] = useState(null);
  const [virtualCard, setVirtualCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      setMessage('✅ User account created successfully!');
      setCurrentStep('hsa');
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.error || 'Failed to create user'));
    }
    
    setLoading(false);
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
      setCurrentStep('card');
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
      setCurrentStep('transaction');
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

  const resetApp = () => {
    setCurrentStep('register');
    setUser(null);
    setHsaAccount(null);
    setVirtualCard(null);
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
        
        {message && (
          <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </header>

      <main className="App-main">
        {/* Step 1: User Registration */}
        {currentStep === 'register' && (
          <div className="step-container">
            <h2>Step 1: Create Your Account</h2>
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
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: HSA Account Creation */}
        {currentStep === 'hsa' && (
          <div className="step-container">
            <h2>Step 2: Create Your HSA Account</h2>
            <div className="info-card">
              <h3>Welcome, {user?.name}!</h3>
              <p>Ready to create your Health Savings Account?</p>
              <p><small>HSAs provide tax advantages for medical expenses</small></p>
            </div>
            <button onClick={handleCreateHSA} disabled={loading} className="primary-btn">
              {loading ? 'Creating HSA...' : 'Create HSA Account'}
            </button>
          </div>
        )}

        {/* Step 3: Card Issuance */}
        {currentStep === 'card' && (
          <div className="step-container">
            <h2>Step 3: Issue Virtual Debit Card</h2>
            <div className="info-card">
              <h3>HSA Account Details</h3>
              <p><strong>Account Number:</strong> {hsaAccount?.accountNumber}</p>
              <p><strong>Current Balance:</strong> ${hsaAccount?.balance?.toFixed(2) || '0.00'}</p>
            </div>
            <button onClick={handleIssueCard} disabled={loading} className="primary-btn">
              {loading ? 'Issuing Card...' : 'Issue Virtual Debit Card'}
            </button>
          </div>
        )}

        {/* Step 4: Transaction Processing */}
        {currentStep === 'transaction' && (
          <div className="step-container">
            <h2>Step 4: Process Transactions</h2>
            
            {/* Virtual Card Display */}
            <div className="card-display">
              <div className="virtual-card">
                <div className="card-number">
                  {virtualCard?.cardNumber?.replace(/(.{4})/g, '$1 ').trim()}
                </div>
                <div className="card-details">
                  <span>EXP: {virtualCard?.expiryMonth}/{virtualCard?.expiryYear}</span>
                  <span>CVV: {virtualCard?.cvv}</span>
                </div>
                <div className="card-balance">
                  Balance: ${hsaAccount?.balance?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>

            {/* Transaction Form */}
            <form onSubmit={handleTransaction} className="form">
              <h3>Simulate a Purchase</h3>
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
              <div className="form-group">
                <label>Merchant:</label>
                <input
                  type="text"
                  name="merchant"
                  value={formData.merchant}
                  onChange={handleInputChange}
                  placeholder="e.g., CVS Pharmacy, Starbucks"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g., Prescription medication, Coffee"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="primary-btn">
                {loading ? 'Processing...' : 'Process Transaction'}
              </button>
            </form>

            <div className="example-transactions">
              <h4>Try these examples:</h4>
              <div className="examples">
                <div className="example qualified">
                  <strong>✅ Qualified:</strong> CVS Pharmacy - "Prescription medication" - $25.99
                </div>
                <div className="example non-qualified">
                  <strong>❌ Not Qualified:</strong> Starbucks - "Coffee and pastry" - $8.50
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reset Button */}
        {currentStep !== 'register' && (
          <button onClick={resetApp} className="reset-btn">
            Start Over
          </button>
        )}
      </main>
    </div>
  );
}

export default App;