import React, { useState } from 'react';
import Modal from '../common/Modal';
import { hsaService } from '../../services/hsaService';

const DepositModal = ({ isOpen, onClose, user, onSuccess, addToast, setLoading, loading }) => {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('form'); // 'form', 'loading', 'confirmation', 'error'
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStep('loading');
    
    // Simulate loading for 0.3 seconds
    setTimeout(async () => {
      try {
        const response = await hsaService.deposit(user.userId, amount);
        setResult(response);
        onSuccess(response.newBalance);
        addToast(`💰 Successfully deposited $${parseFloat(amount).toFixed(2)}!`, 'success');
        handleClose();
      } catch (error) {
        setErrorMessage(error.response?.data?.error || 'Deposit failed');
        addToast(`❌ ${error.response?.data?.error || 'Deposit failed'}`, 'error');
        setStep('error');
      }
    }, 300);
  };

  const handleClose = () => {
    setAmount('');
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
      case 'loading': return 'Processing Deposit...';
      case 'confirmation': return 'Deposit Successful';
      case 'error': return 'Deposit Failed';
      default: return 'Deposit Money';
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
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleClose} className="secondary-btn">
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              Deposit
            </button>
          </div>
        </form>
      )}

      {step === 'loading' && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '18px', marginBottom: '1rem' }}>Processing your deposit...</div>
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
            Deposit Successful!
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Amount:</strong> ${parseFloat(amount).toFixed(2)}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>New Balance:</strong> ${result.newBalance.toFixed(2)}
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <strong>Remaining Annual Limit:</strong> ${result.remainingLimit.toFixed(2)}
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
            Deposit Failed
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

export default DepositModal;
