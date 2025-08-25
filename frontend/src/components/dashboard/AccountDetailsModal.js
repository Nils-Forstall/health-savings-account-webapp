import React, { useState } from 'react';
import Modal from '../common/Modal';

const AccountDetailsModal = ({ isOpen, onClose, user, hsaAccount }) => {
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  const handleClose = () => {
    setShowSensitiveInfo(false);
    onClose();
  };

  const handleShowDetails = () => {
    setShowSensitiveInfo(true);
  };

  const handleHideDetails = () => {
    setShowSensitiveInfo(false);
  };

  const formatCardNumber = (cardNumber) => {
    if (!cardNumber) return 'Not Available';
    return cardNumber.replace(/(.{4})/g, '$1 ').trim();
  };

  const maskCardNumber = (cardNumber) => {
    if (!cardNumber) return 'Not Available';
    const lastFour = cardNumber.slice(-4);
    return `•••• •••• •••• ${lastFour}`;
  };

  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return 'Not Available';
    const lastFour = accountNumber.slice(-4);
    return `****${lastFour}`;
  };

  // Mock data - in a real app, this would come from the backend
  const accountDetails = {
    cardNumber: hsaAccount?.debitCardNumber || '4532123456789012',
    expiryDate: hsaAccount?.cardExpiry || '12/27',
    cvv: hsaAccount?.cardCvv || '123',
    accountNumber: hsaAccount?.accountNumber || hsaAccount?.account_number || '123456789012'
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Account Details">
      <div style={{ padding: '1rem 0' }}>
        {!showSensitiveInfo && (
          <div>
            <div style={{ 
              backgroundColor: '#f8d7da', 
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔐</div>
              <h4 style={{ color: '#721c24', marginBottom: '1rem' }}>Security Confirmation</h4>
              <p style={{ color: '#721c24', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                You are about to view sensitive financial information including your full debit card number and HSA account details. 
                <br /><br />
                <strong>Please ensure:</strong>
                <br />• You are in a private, secure location
                <br />• No one else can see your screen
                <br />• You will not screenshot or share this information
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  onClick={handleClose}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleShowDetails}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  I Understand - Show Details
                </button>
              </div>
            </div>
          </div>
        )}

        {showSensitiveInfo && (
          <div>
            <div style={{ 
              backgroundColor: '#d1ecf1', 
              border: '1px solid #bee5eb',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <strong style={{ color: '#0c5460' }}>🔓 Sensitive Information Visible</strong>
            </div>

            {/* Debit Card Display */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem', color: '#333' }}>HSA Debit Card</h4>
              <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '1.5rem',
                color: 'white',
                fontFamily: 'monospace',
                position: 'relative',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                minHeight: '180px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>HSA DEBIT</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>VISA</div>
                </div>
                
                <div style={{ margin: '1rem 0' }}>
                  <div style={{ 
                    fontSize: '1.4rem', 
                    letterSpacing: '0.1em',
                    fontWeight: '500',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    {formatCardNumber(accountDetails.cardNumber)}
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.2rem' }}>CARDHOLDER</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{user?.name?.toUpperCase() || 'CARDHOLDER NAME'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.2rem' }}>EXPIRES</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{accountDetails.expiryDate}</div>
                  </div>
                </div>
              </div>
              
              <div style={{ 
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ 
                  fontSize: '0.9rem',
                  color: '#666',
                  marginBottom: '0.5rem'
                }}>
                  <strong>CVV:</strong> <span style={{ fontFamily: 'monospace', fontSize: '1rem' }}>{accountDetails.cvv}</span>
                </div>
              </div>
            </div>

            {/* HSA Account Information */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem', color: '#333' }}>HSA Account Information</h4>
              <div style={{ 
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ 
                  fontSize: '1rem',
                  fontFamily: 'monospace'
                }}>
                  <strong>HSA Account Number:</strong> {accountDetails.accountNumber}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button 
                onClick={handleHideDetails}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🔒 Hide Details
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AccountDetailsModal;
