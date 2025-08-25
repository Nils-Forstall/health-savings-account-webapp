import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const AccountDetailsModal = ({ isOpen, onClose, user, hsaAccount }) => {
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  const [accountDetails, setAccountDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    setShowSensitiveInfo(false);
    setAccountDetails(null);
    setError(null);
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

  // Fetch account details from backend
  useEffect(() => {
    if (isOpen && user?.userId && !accountDetails) {
      fetchAccountDetails();
    }
  }, [isOpen, user?.userId]);

  const fetchAccountDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3001/api/card/details/${user.userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No card found. Please contact support to issue a card.');
        }
        throw new Error('Failed to fetch account details');
      }
      
      const data = await response.json();
      setAccountDetails({
        cardNumber: data.cardNumber,
        expiryDate: data.expiryDate,
        cvv: data.cvv,
        accountNumber: data.accountNumber,
        cardholderName: data.cardholderName
      });
    } catch (err) {
      console.error('Error fetching account details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/card/issue-for-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.userId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to issue card');
      }
      
      const data = await response.json();
      console.log('Card issued successfully:', data);
      
      // After successful card issuance, fetch account details
      await fetchAccountDetails();
    } catch (err) {
      console.error('Error issuing card:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Account Details">
      <div style={{ padding: '1rem 0' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⏳</div>
            <p>Loading account details...</p>
          </div>
        )}
        
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            color: '#721c24',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠️</div>
            <strong>Error:</strong> {error}
            {error.includes('No card found') && (
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={handleIssueCard}
                  disabled={loading}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Issuing Card...' : 'Issue Virtual Card'}
                </button>
              </div>
            )}
          </div>
        )}
        
        {!loading && !error && accountDetails && (
          <>
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
                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{accountDetails.cardholderName?.toUpperCase() || user?.name?.toUpperCase() || 'CARDHOLDER NAME'}</div>
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
          </>
        )}
      </div>
    </Modal>
  );
};

export default AccountDetailsModal;
