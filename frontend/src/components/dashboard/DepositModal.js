import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import InfoTooltip from '../common/InfoTooltip';
import { hsaService } from '../../services/hsaService';
import { handleCurrencyInputChange } from '../../utils/currencyUtils';

const DepositModal = ({ isOpen, onClose, user, hsaAccount, onSuccess, addToast, setLoading, loading }) => {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('form'); // 'form', 'loading', 'confirmation', 'error'
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [contributionLimits, setContributionLimits] = useState(null);
  const [isAmountValid, setIsAmountValid] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStep('loading');
    
    // Simulate loading for 0.3 seconds
    setTimeout(async () => {
      try {
        const response = await hsaService.deposit(user.userId, amount);
        setResult(response);
        onSuccess(response.newBalance);
        addToast(`💰 Successfully deposited $${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}!`, 'success');
        handleClose();
      } catch (error) {
        setErrorMessage(error.response?.data?.error || 'Deposit failed');
        addToast(`❌ ${error.response?.data?.error || 'Deposit failed'}`, 'error');
        setStep('error');
      }
    }, 300);
  };

  const validateAmount = (value) => {
    if (!value) {
      setIsAmountValid(true);
      return;
    }
    const numValue = parseFloat(value);
    const maxDeposit = contributionLimits?.remainingLimit || 0;
    setIsAmountValid(numValue > 0 && numValue <= maxDeposit);
  };

  const handleAmountChange = (e) => {
    const newAmount = handleCurrencyInputChange(e, setAmount);
    validateAmount(e.target.value);
  };

  // Fetch contribution limits when modal opens
  useEffect(() => {
    if (isOpen && user?.userId) {
      console.log('Fetching contribution limits for user:', user.userId);
      hsaService.getContributionLimits(user.userId)
        .then((limits) => {
          console.log('Contribution limits received:', limits);
          setContributionLimits(limits);
          // Re-validate amount with new limits
          if (amount) {
            validateAmount(amount);
          }
        })
        .catch((error) => {
          console.error('Failed to fetch contribution limits:', error);
        });
    }
  }, [isOpen, user?.userId]);

  const handleClose = () => {
    setAmount('');
    setStep('form');
    setResult(null);
    setErrorMessage('');
    setContributionLimits(null);
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
            {contributionLimits && (
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
                justifyContent: 'space-between'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {!isAmountValid && amount && <span>⚠️</span>}
                  Maximum deposit: ${contributionLimits.remainingLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <InfoTooltip 
                  user={user}
                  contributionLimits={contributionLimits}
                />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
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
            <strong>Amount:</strong> ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>New Balance:</strong> ${result.newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <strong>Remaining Annual Limit:</strong> ${result.remainingLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
