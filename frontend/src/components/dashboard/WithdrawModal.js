import React, { useState } from 'react';
import Modal from '../common/Modal';
import { hsaService } from '../../services/hsaService';
import { handleCurrencyInputChange } from '../../utils/currencyUtils';
import axios from 'axios';

const WithdrawModal = ({ isOpen, onClose, user, hsaAccount, onSuccess, addToast, setLoading, loading }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [expenseOptions, setExpenseOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form', 'loading', 'confirmation', 'error'
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAmountValid, setIsAmountValid] = useState(true);
  const [proofFile, setProofFile] = useState(null);
  const [proofFileName, setProofFileName] = useState('');
  
  // Card validation fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  const validateAmount = (value) => {
    if (!value) {
      setIsAmountValid(true);
      return;
    }
    const numValue = parseFloat(value);
    const maxWithdrawal = hsaAccount?.balance || 0;
    setIsAmountValid(numValue > 0 && numValue <= maxWithdrawal);
  };

  const handleAmountChange = (e) => {
    const newAmount = handleCurrencyInputChange(e, setAmount);
    validateAmount(e.target.value);
  };

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        addToast('❌ File size must be less than 10MB', 'error');
        return;
      }
      
      // Check file type (images and PDFs only)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        addToast('❌ Only images (JPEG, PNG, GIF) and PDF files are allowed', 'error');
        return;
      }
      
      setProofFile(file);
      setProofFileName(file.name);
    }
  };

  const removeProofFile = () => {
    setProofFile(null);
    setProofFileName('');
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted);
    }
  };

  const validateCardInfo = () => {
    if (!cardNumber || !expiryMonth || !expiryYear || !cvv) {
      setErrorMessage('Please fill in all card information fields');
      addToast('❌ Please fill in all card information fields', 'error');
      setStep('error');
      return false;
    }

    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (!/^\d{16}$/.test(cleanCardNumber)) {
      setErrorMessage('Please enter a valid 16-digit card number');
      addToast('❌ Please enter a valid 16-digit card number', 'error');
      setStep('error');
      return false;
    }

    const month = parseInt(expiryMonth);
    const year = parseInt(expiryYear);
    if (month < 1 || month > 12) {
      setErrorMessage('Please enter a valid expiry month (1-12)');
      addToast('❌ Please enter a valid expiry month (1-12)', 'error');
      setStep('error');
      return false;
    }
    if (year < new Date().getFullYear()) {
      setErrorMessage('Card appears to be expired');
      addToast('❌ Card appears to be expired', 'error');
      setStep('error');
      return false;
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      setErrorMessage('Please enter a valid CVV (3-4 digits)');
      addToast('❌ Please enter a valid CVV (3-4 digits)', 'error');
      setStep('error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that a qualified expense was selected
    if (!selectedExpense || !selectedExpense.is_qualified) {
      setErrorMessage('Please select a qualified HSA expense from the dropdown');
      addToast('❌ Please select a qualified HSA expense from the dropdown', 'error');
      setStep('error');
      return;
    }

    // Validate card information
    if (!validateCardInfo()) {
      return;
    }

    setStep('loading');
    
    // Simulate loading for 0.3 seconds
    setTimeout(async () => {
      try {
        const cleanCardNumber = cardNumber.replace(/\s/g, '');
        const response = await hsaService.withdraw(user.userId, amount, reason, cleanCardNumber, expiryMonth, expiryYear, cvv);
        setResult(response);
        onSuccess(response.newBalance);
        addToast(`💸 Successfully reimbursed $${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for ${reason}!`, 'success');
        handleClose();
      } catch (error) {
        console.error('Reumbursement error:', error);
        
        // Extract detailed error information
        const errorData = error.response?.data;
        let detailedMessage = 'Reimbursement failed';
        
        if (errorData?.error) {
          if (errorData.error.includes('Insufficient funds')) {
            detailedMessage = `Insufficient funds. Available balance: $${errorData.availableBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'Unknown'}`;
          } else if (errorData.error.includes('HSA account not found')) {
            detailedMessage = 'HSA account not found. Please contact support.';
          } else if (errorData.error.includes('Valid user ID and positive amount are required')) {
            detailedMessage = 'Invalid reimbursement amount. Please enter a valid positive amount.';
          } else if (errorData.error.includes('Failed to process reimbursement')) {
            detailedMessage = 'Transaction processing failed. Please try again or contact support.';
          } else {
            detailedMessage = errorData.error;
          }
        } else if (error.response?.status === 400) {
          detailedMessage = 'Invalid reimbursement request. Please check your input and try again.';
        } else if (error.response?.status === 404) {
          detailedMessage = 'Account not found. Please contact support.';
        } else if (error.response?.status >= 500) {
          detailedMessage = 'Server error. Please try again later or contact support.';
        } else if (error.code === 'NETWORK_ERROR' || !error.response) {
          detailedMessage = 'Network error. Please check your connection and try again.';
        }
        
        setErrorMessage(detailedMessage);
        addToast(`❌ ${detailedMessage}`, 'error');
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
    setProofFile(null);
    setProofFileName('');
    setCardNumber('');
    setExpiryMonth('');
    setExpiryYear('');
    setCvv('');
    setStep('form');
    setResult(null);
    setErrorMessage('');
    onClose();
  };

  const handleCloseFromError = () => {
    // Only clear the step and error message, keep form data intact
    setStep('form');
    setErrorMessage('');
    onClose();
  };

  const handleTryAgain = () => {
    setStep('form');
    setErrorMessage('');
  };

  const getModalTitle = () => {
    switch (step) {
      case 'loading': return 'Processing Reimbursement...';
      case 'confirmation': return 'Reimbursement Successful';
      case 'error': return 'Reimbursement Failed';
      default: return 'Reimburse Expense';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={step === 'loading' ? null : handleClose} title={getModalTitle()}>
      {step === 'form' && (
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Amount ($):</label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              required
              autoFocus
              style={{
                color: !isAmountValid && amount ? '#dc3545' : 'inherit',
                borderColor: !isAmountValid && amount ? '#dc3545' : 'inherit'
              }}
            />
            {hsaAccount?.balance !== undefined && (
              <div style={{ 
                fontSize: '14px', 
                color: !isAmountValid && amount ? '#dc3545' : '#000',
                marginTop: '6px',
                fontWeight: '500',
                padding: '4px 8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {!isAmountValid && amount && <span>⚠️</span>}
                Available balance: ${hsaAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Expense to reimburse:</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={reason}
                onChange={(e) => handleReasonChange(e.target.value)}
                onFocus={() => reason.length >= 3 && setShowDropdown(expenseOptions.length > 0)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Search for HSA-qualified expenses..."
                required
              />
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
                  zIndex: 9999,
                  marginTop: '2px'
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
                      alignItems: 'center',
                      backgroundColor: 'white',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseDown={() => selectReason(expense)}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    <span>{expense.name}</span>
                    <span 
                      style={{
                        fontSize: '12px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor: expense.is_qualified === true ? '#d4edda' : '#f8d7da',
                        color: expense.is_qualified === true ? '#155724' : '#721c24',
                        border: expense.is_qualified === true ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
                        fontWeight: '500',
                        pointerEvents: 'none'
                      }}
                    >
                      {expense.is_qualified === true ? '✓ Qualified' : '✗ Not Qualified'}
                    </span>
                  </div>
                ))}
                </div>
              )}
            </div>
            <div style={{ 
              fontSize: '13px', 
              color: '#6c757d',
              marginTop: '6px',
              lineHeight: '1.4'
            }}>
              Only HSA-qualified medical expenses will be reimbursed (prescriptions, doctor visits, medical equipment, etc.)
            </div>
            {selectedExpense && (
              <div style={{
                marginTop: '8px',
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: selectedExpense.is_qualified === true ? '#d4edda' : '#f8d7da',
                color: selectedExpense.is_qualified === true ? '#155724' : '#721c24',
                fontSize: '14px',
                border: selectedExpense.is_qualified === true ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
                fontWeight: '500'
              }}>
                Selected: {selectedExpense.name} - {selectedExpense.is_qualified === true ? 'HSA Qualified ✓' : 'Not HSA Qualified ✗'}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label>Proof of Expense (Optional):</label>
            <div style={{ position: 'relative' }}>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="proof-upload"
              />
              <label
                htmlFor="proof-upload"
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  backgroundColor: '#f8f9fa',
                  border: '2px dashed #dee2e6',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  width: '100%',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e9ecef';
                  e.target.style.borderColor = '#adb5bd';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f8f9fa';
                  e.target.style.borderColor = '#dee2e6';
                }}
              >
                📎 Click to upload receipt or proof (Images or PDF, max 10MB)
              </label>
              
              <div style={{ 
                fontSize: '13px', 
                color: '#6c757d',
                marginTop: '6px',
                lineHeight: '1.4'
              }}>
                💡 Upload receipts, invoices, or other documentation to support your reimbursement
              </div>
              
              {proofFileName && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px',
                  backgroundColor: '#d4edda',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '14px',
                  color: '#155724'
                }}>
                  <span>📄 {proofFileName}</span>
                  <button
                    type="button"
                    onClick={removeProofFile}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#721c24',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '0 4px'
                    }}
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
            <button type="button" onClick={handleClose} className="secondary-btn">
              Cancel
            </button>
            <button 
              type="submit" 
              className="primary-btn"
              disabled={!cardNumber || !expiryMonth || !expiryYear || !cvv || !amount || !selectedExpense}
              style={{
                opacity: (!cardNumber || !expiryMonth || !expiryYear || !cvv || !amount || !selectedExpense) ? 0.6 : 1,
                cursor: (!cardNumber || !expiryMonth || !expiryYear || !cvv || !amount || !selectedExpense) ? 'not-allowed' : 'pointer'
              }}
            >
              Reimburse
            </button>
          </div>
        </form>
      )}

      {step === 'loading' && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '18px', marginBottom: '1rem' }}>Processing your reimbursement...</div>
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
            Reimbursement successful!
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Amount:</strong> ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Reason:</strong> {reason}
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <strong>New Balance:</strong> ${result.newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            Reimbursement Failed
          </div>
          <div style={{ marginBottom: '2rem', color: '#dc3545' }}>
            {errorMessage}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={handleTryAgain} className="secondary-btn">
              Try Again
            </button>
            <button onClick={handleCloseFromError} className="primary-btn">
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default WithdrawModal;
