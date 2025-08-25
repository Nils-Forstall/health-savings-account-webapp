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
  const [localMessage, setLocalMessage] = useState('');

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
    setLoading(true);
    setLocalMessage('');

    // Validate that a qualified expense was selected
    if (!selectedExpense || !selectedExpense.is_qualified) {
      setLocalMessage('❌ Please select a qualified HSA expense from the dropdown');
      setLoading(false);
      return;
    }

    try {
      const response = await hsaService.withdraw(user.userId, amount, reason);
      setLocalMessage(`✅ Withdrawal successful! New balance: $${response.newBalance.toFixed(2)}`);
      setAmount('');
      setReason('');
      setSelectedExpense(null);
      onSuccess(response.newBalance);
      setTimeout(() => {
        setLocalMessage('');
        onClose();
      }, 2000);
    } catch (error) {
      setLocalMessage('❌ ' + (error.response?.data?.error || 'Withdrawal failed'));
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    setAmount('');
    setReason('');
    setSelectedExpense(null);
    setShowDropdown(false);
    setExpenseOptions([]);
    setLocalMessage('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Withdraw Money">
      <form onSubmit={handleSubmit} className="form">
        {localMessage && (
          <div className={`message ${localMessage.includes('❌') ? 'error' : 'success'}`} style={{ marginBottom: '1rem' }}>
            {localMessage}
          </div>
        )}
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
          <button type="submit" disabled={loading} className="primary-btn">
            {loading ? 'Processing...' : 'Withdraw'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default WithdrawModal;
