import React, { useState } from 'react';
import { hsaService } from '../../services/hsaService';

const CardSimulatorPage = ({ addToast, setLoading, loading, onBackToHome }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!cardNumber || !expiryMonth || !expiryYear || !cvv || !amount || !merchant || !description) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    const transactionAmount = parseFloat(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      addToast('Please enter a valid amount', 'error');
      return;
    }

    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (!/^\d{16}$/.test(cleanCardNumber)) {
      addToast('Please enter a valid 16-digit card number', 'error');
      return;
    }

    const month = parseInt(expiryMonth);
    const year = parseInt(expiryYear);
    if (month < 1 || month > 12) {
      addToast('Please enter a valid expiry month (1-12)', 'error');
      return;
    }
    if (year < new Date().getFullYear()) {
      addToast('Card appears to be expired', 'error');
      return;
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      addToast('Please enter a valid CVV (3-4 digits)', 'error');
      return;
    }

    setValidationError(''); // Clear any previous errors
    setIsProcessing(true);
    setLoading(true);

    try {
      const result = await hsaService.processTransaction(
        cleanCardNumber,
        transactionAmount,
        merchant,
        description,
        expiryMonth,
        expiryYear,
        cvv
      );

      console.log('Transaction result:', result); // Debug log

      if (result.status === 'APPROVED') {
        setTransactionResult(result);
        setShowResult(true);
        addToast(`Transaction approved! Amount: $${result.amount?.toFixed(2)}`, 'success');
      } else {
        // Show validation error inline instead of jumping to result page
        const declineReason = result.reason || result.message || 'Transaction declined';
        setValidationError(declineReason);
        addToast(`Transaction declined: ${declineReason}`, 'error');
      }
    } catch (error) {
      console.error('Transaction processing error:', error);
      setValidationError('Failed to process transaction. Please try again.');
      addToast('Failed to process transaction. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCardNumber('');
    setExpiryMonth('');
    setExpiryYear('');
    setCvv('');
    setAmount('');
    setMerchant('');
    setDescription('');
    setShowResult(false);
    setTransactionResult(null);
    setValidationError('');
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
      if (validationError) setValidationError(''); // Clear error when user starts typing
    }
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (validationError) setValidationError(''); // Clear error when user starts typing
  };

  if (showResult) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button 
            onClick={onBackToHome}
            style={{
              background: 'none',
              border: '1px solid #007bff',
              color: '#007bff',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: '1rem'
            }}
          >
            ← Back to Home
          </button>
        </div>

        <div style={{ 
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '1rem',
            color: transactionResult?.status === 'APPROVED' ? '#28a745' : '#dc3545'
          }}>
            {transactionResult?.status === 'APPROVED' ? '✅' : '❌'}
          </div>
          
          <h2 style={{ 
            margin: '0 0 1rem 0', 
            color: transactionResult?.status === 'APPROVED' ? '#28a745' : '#dc3545'
          }}>
            Transaction {transactionResult?.status}
          </h2>

          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Card Number:</strong> •••• •••• •••• {cardNumber.slice(-4)}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Amount:</strong> ${transactionResult?.amount?.toFixed(2)}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Merchant:</strong> {transactionResult?.merchant}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Status:</strong> {transactionResult?.status}
            </div>
            <div>
              <strong>Message:</strong> {transactionResult?.reason || transactionResult?.message || 'No details available'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={handleReset}
              style={{ 
                background: '#007bff',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              New Transaction
            </button>
            <button 
              onClick={onBackToHome}
              style={{ 
                background: '#6c757d',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <button 
          onClick={onBackToHome}
          style={{
            background: 'none',
            border: '1px solid #007bff',
            color: '#007bff',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            marginBottom: '1rem'
          }}
        >
          ← Back to Home
        </button>
      </div>

      <div style={{ 
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>
          💳 HSA Card Transaction Simulator
        </h2>
        
        <div style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '8px',
          border: '1px solid #2196f3'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#1565c0' }}>
            <strong>Test any HSA debit card</strong> by entering card details below. 
            The system will validate if the merchant and purchase qualify for HSA funds.
            No authentication required - perfect for testing different scenarios.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#333', fontSize: '1.1rem' }}>Card Information</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#333'
              }}>
                Card Number
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#333'
                }}>
                  Expiry Month
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={expiryMonth}
                  onChange={handleInputChange(setExpiryMonth)}
                  placeholder="MM"
                  disabled={isProcessing}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#333'
                }}>
                  Expiry Year
                </label>
                <input
                  type="number"
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 10}
                  value={expiryYear}
                  onChange={handleInputChange(setExpiryYear)}
                  placeholder="YYYY"
                  disabled={isProcessing}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#333'
                }}>
                  CVV
                </label>
                <input
                  type="text"
                  maxLength="4"
                  value={cvv}
                  onChange={(e) => {
                    setCvv(e.target.value.replace(/\D/g, ''));
                    if (validationError) setValidationError('');
                  }}
                  placeholder="123"
                  disabled={isProcessing}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#333', fontSize: '1.1rem' }}>Transaction Details</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#333'
              }}>
                Transaction Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={handleInputChange(setAmount)}
                placeholder="0.00"
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
              <style jsx>{`
                input[type="number"]::-webkit-outer-spin-button,
                input[type="number"]::-webkit-inner-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }
                input[type="number"] {
                  -moz-appearance: textfield;
                }
              `}</style>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#333'
              }}>
                Merchant Name
              </label>
              <input
                type="text"
                value={merchant}
                onChange={handleInputChange(setMerchant)}
                placeholder="e.g., CVS Pharmacy, Walgreens, Dr. Smith's Office"
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#333'
              }}>
                Purchase Description
              </label>
              <input
                type="text"
                value={description}
                onChange={handleInputChange(setDescription)}
                placeholder="e.g., Prescription medication, Medical supplies, Doctor visit copay"
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {validationError && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              border: '1px solid #f5c6cb',
              borderRadius: '6px',
              fontSize: '0.95rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <span>{validationError}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              type="button" 
              onClick={handleReset} 
              disabled={isProcessing}
              style={{ 
                background: '#6c757d',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.6 : 1
              }}
            >
              Reset Form
            </button>
            <button 
              type="submit" 
              disabled={isProcessing || !cardNumber || !expiryMonth || !expiryYear || !cvv || !amount || !merchant || !description}
              style={{ 
                background: isProcessing ? '#6c757d' : '#007bff',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: (isProcessing || !cardNumber || !expiryMonth || !expiryYear || !cvv || !amount || !merchant || !description) ? 'not-allowed' : 'pointer',
                opacity: (isProcessing || !cardNumber || !expiryMonth || !expiryYear || !cvv || !amount || !merchant || !description) ? 0.6 : 1
              }}
            >
              {isProcessing ? 'Processing...' : 'Process Transaction'}
            </button>
          </div>
        </form>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: '#666'
        }}>
          <strong>Test Examples:</strong><br/>
          • Valid: CVS Pharmacy + "Prescription medication"<br/>
          • Invalid: Starbucks + "Coffee and pastry"<br/>
          • Card numbers starting with 4000 are typically valid in this system
        </div>
      </div>
    </div>
  );
};

export default CardSimulatorPage;
