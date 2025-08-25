import React, { useState } from 'react';
import { hsaService } from '../../services/hsaService';

const CardTransactionModal = ({ 
  isOpen, 
  onClose, 
  user, 
  hsaAccount, 
  onSuccess, 
  addToast, 
  setLoading, 
  loading 
}) => {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || !merchant || !description) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    const transactionAmount = parseFloat(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      addToast('Please enter a valid amount', 'error');
      return;
    }

    if (transactionAmount > hsaAccount.balance) {
      addToast('Insufficient funds for this transaction', 'error');
      return;
    }

    setIsProcessing(true);
    setLoading(true);

    try {
      const result = await hsaService.processTransaction(
        hsaAccount.cardNumber || '4000077159835754', // Use actual card number or fallback
        transactionAmount,
        merchant,
        description
      );

      setTransactionResult(result);
      setShowConfirmation(true);

      if (result.status === 'APPROVED') {
        addToast(`Transaction approved! New balance: $${result.newBalance.toFixed(2)}`, 'success');
        onSuccess(result.newBalance);
      } else {
        addToast(`Transaction declined: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Transaction processing error:', error);
      addToast('Failed to process transaction. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setAmount('');
      setMerchant('');
      setDescription('');
      setShowConfirmation(false);
      setTransactionResult(null);
      onClose();
    }
  };

  const handleNewTransaction = () => {
    setAmount('');
    setMerchant('');
    setDescription('');
    setShowConfirmation(false);
    setTransactionResult(null);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {!showConfirmation ? (
          <>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: 0, color: '#333' }}>💳 Card Transaction Simulator</h3>
              <button 
                onClick={handleClose} 
                disabled={isProcessing}
                style={{ 
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  color: '#666',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                <strong>Simulate a point-of-sale purchase</strong> using your HSA debit card. 
                The system will validate if the merchant and purchase qualify for HSA funds.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
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
                  step="0.01"
                  min="0.01"
                  max={hsaAccount.balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
                <small style={{ color: '#666', fontSize: '0.8rem' }}>
                  Available balance: ${hsaAccount.balance?.toFixed(2) || '0.00'}
                </small>
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
                  onChange={(e) => setMerchant(e.target.value)}
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
                  onChange={(e) => setDescription(e.target.value)}
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

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={handleClose} 
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
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isProcessing || !amount || !merchant || !description}
                  style={{ 
                    background: isProcessing ? '#6c757d' : '#007bff',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: (isProcessing || !amount || !merchant || !description) ? 'not-allowed' : 'pointer',
                    opacity: (isProcessing || !amount || !merchant || !description) ? 0.6 : 1
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Process Transaction'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '1rem',
                color: transactionResult?.status === 'APPROVED' ? '#28a745' : '#dc3545'
              }}>
                {transactionResult?.status === 'APPROVED' ? '✅' : '❌'}
              </div>
              
              <h3 style={{ 
                margin: '0 0 1rem 0', 
                color: transactionResult?.status === 'APPROVED' ? '#28a745' : '#dc3545'
              }}>
                Transaction {transactionResult?.status}
              </h3>

              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Amount:</strong> ${transactionResult?.amount?.toFixed(2)}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Merchant:</strong> {transactionResult?.merchant}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Status:</strong> {transactionResult?.status}
                </div>
                {transactionResult?.status === 'APPROVED' && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>New Balance:</strong> ${transactionResult?.newBalance?.toFixed(2)}
                  </div>
                )}
                <div>
                  <strong>Message:</strong> {transactionResult?.message}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  onClick={handleNewTransaction}
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
                  onClick={handleClose}
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
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CardTransactionModal;
