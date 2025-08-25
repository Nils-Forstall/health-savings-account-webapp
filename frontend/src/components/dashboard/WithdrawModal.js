import React, { useState } from 'react';
import Modal from '../common/Modal';
import { hsaService } from '../../services/hsaService';
import axios from 'axios';

const WithdrawModal = ({ isOpen, onClose, user, onSuccess, setMessage, setLoading, loading }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [expenseOptions, setExpenseOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form', 'loading', 'confirmation', 'error'
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleReasonChange = async (value) => {
    setReason(value);
    setSelectedExpense(null);
    
    if (value.length >= 3) {
      setSearchLoading(true);
      try {
        const response = await axios.get(`http://localhost:3001/api/expenses/dropdown-search?q=${encodeURIComponent(value)}&limit=10`);
        console.log('API Response:', response.data); // Debug log
        setExpenseOptions(response.data.suggestions || []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error searching expenses:', error);
        setExpenseOptions([]);
      }
      setSearchLoading(false);
    } else {
      setExpenseOptions([]);
      setShowDropdown(false);
    }
  };

  const selectReason = (expense) => {
    setReason(expense.name);
    setSelectedExpense(expense);
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that a qualified expense was selected
    if (!selectedExpense || !selectedExpense.is_qualified) {
      setErrorMessage('Please select a qualified HSA expense from the dropdown');
      setStep('error');
      return;
    }

    setStep('loading');
    
    // Simulate loading for 0.3 seconds
    setTimeout(async () => {
      try {
        const response = await hsaService.withdraw(user.userId, amount, reason);
        setResult(response);
        onSuccess(response.newBalance);
        setStep('confirmation');
      } catch (error) {
        setErrorMessage(error.response?.data?.error || 'Withdrawal failed');
        setStep('error');
      }
    }, 300);
  };

  const handleClose = () => {
    setAmount('');
    setReason('');
    setSelectedExpense(null);
    setShowDropdown(false);
    setExpenseOptions([]);
    setStep('form');
    setResult(null);
    setErrorMessage('');
    onClose();
  };

  const handleTryAgain = () => {
    setStep('form');
    setErrorMessage('');
  };

  const getModalTitle = () => {
    switch (step) {
      case 'loading': return 'Processing Withdrawal...';
      case 'confirmation': return 'Withdrawal Successful';
      case 'error': return 'Withdrawal Failed';
      default: return 'Withdraw Money';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={step === 'loading' ? null : handleClose} title={getModalTitle()}>
      {step === 'form' && (
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Amount ($):</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Reason for withdrawal:</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              onFocus={() => reason.length >= 3 && setShowDropdown(expenseOptions.length > 0)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Type at least 3 characters to search HSA expenses..."
              required
            />
            {searchLoading && (
              <div style={{ padding: '8px', fontSize: '14px', color: '#666' }}>
                {/* Searching... */}
              </div>
            )}
            {showDropdown && expenseOptions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000
              }}>
                {expenseOptions.map((expense, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: index < expenseOptions.length - 1 ? '1px solid #eee' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseDown={() => selectReason(expense)}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    <span>{expense.name}</span>
                    <span style={{
                      fontSize: '12px',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      backgroundColor: expense.is_qualified ? '#d4edda' : '#f8d7da',
                      color: expense.is_qualified ? '#155724' : '#721c24'
                    }}>
                      {expense.is_qualified ? '✓ Qualified' : '✗ Not Qualified'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {selectedExpense && (
              <div style={{
                marginTop: '8px',
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: selectedExpense.is_qualified ? '#d4edda' : '#f8d7da',
                color: selectedExpense.is_qualified ? '#155724' : '#721c24',
                fontSize: '14px'
              }}>
                Selected: {selectedExpense.name} - {selectedExpense.is_qualified ? 'HSA Qualified ✓' : 'Not HSA Qualified ✗'}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleClose} className="secondary-btn">
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              Withdraw
            </button>
          </div>
        </form>
      )}

      {step === 'loading' && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '18px', marginBottom: '1rem' }}>Processing your withdrawal...</div>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {step === 'confirmation' && result && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '48px', color: '#28a745', marginBottom: '1rem' }}>✅</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '1rem' }}>
            Withdrawal Successful!
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Amount:</strong> ${parseFloat(amount).toFixed(2)}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Reason:</strong> {reason}
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <strong>New Balance:</strong> ${result.newBalance.toFixed(2)}
          </div>
          <button onClick={handleClose} className="primary-btn">
            Done
          </button>
        </div>
      )}

      {step === 'error' && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '48px', color: '#dc3545', marginBottom: '1rem' }}>❌</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '1rem' }}>
            Withdrawal Failed
          </div>
          <div style={{ marginBottom: '2rem', color: '#dc3545' }}>
            {errorMessage}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={handleTryAgain} className="secondary-btn">
              Try Again
            </button>
            <button onClick={handleClose} className="primary-btn">
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default WithdrawModal;
