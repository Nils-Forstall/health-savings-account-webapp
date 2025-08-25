import React, { useState, useEffect } from 'react';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import AccountDetailsModal from './AccountDetailsModal';
import TransactionHistory from './TransactionHistory';
import ContributionLimits from './ContributionLimits';
import { hsaService } from '../../services/hsaService';

const Dashboard = ({ 
  user, 
  hsaAccount, 
  transactions, 
  onBalanceUpdate, 
  onTransactionHistoryUpdate,
  addToast, 
  setLoading, 
  loading,
  onLogout
}) => {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isAccountDetailsModalOpen, setIsAccountDetailsModalOpen] = useState(false);
  const [contributionRefreshTrigger, setContributionRefreshTrigger] = useState(0);
  const [contributionLimits, setContributionLimits] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Fetch contribution limits on component mount and when refresh is triggered
  useEffect(() => {
    const fetchContributionLimits = async () => {
      if (!user?.userId) return;
      
      try {
        const limits = await hsaService.getContributionLimits(user.userId);
        setContributionLimits(limits);
      } catch (error) {
        console.error('Failed to fetch contribution limits:', error);
      }
    };

    fetchContributionLimits();
  }, [user?.userId, contributionRefreshTrigger]);

  const handleDepositSuccess = (newBalance) => {
    onBalanceUpdate(newBalance);
    onTransactionHistoryUpdate();
    setContributionRefreshTrigger(prev => prev + 1); // Trigger ContributionLimits refresh
  };

  const handleWithdrawSuccess = (newBalance) => {
    onBalanceUpdate(newBalance);
    onTransactionHistoryUpdate();
    setContributionRefreshTrigger(prev => prev + 1); // Trigger ContributionLimits refresh
  };


  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  // Check if deposits should be disabled
  const isDepositDisabled = loading || (contributionLimits && contributionLimits.remainingLimit <= 0);
  
  // Check if withdrawals should be disabled
  const isWithdrawDisabled = loading || (hsaAccount?.balance <= 0);

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h2 style={{ margin: 0, textAlign: 'left', lineHeight: '1', fontSize: '1.5rem' }}>
          {user?.isFirstLogin ? `Welcome, ${user?.name}!` : `Welcome back, ${user?.name}!`}
        </h2>
        <button 
          onClick={handleLogoutClick} 
          style={{ 
            background: '#e74c3c',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            margin: 0,
            height: 'auto',
            lineHeight: '1.2',
            fontWeight: '500'
          }}
          onMouseOver={(e) => e.target.style.background = '#c0392b'}
          onMouseOut={(e) => e.target.style.background = '#e74c3c'}
        >
          Logout
        </button>
      </div>
      
      <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
        <button 
          onClick={() => setIsAccountDetailsModalOpen(true)} 
          className="primary-btn"
          disabled={loading}
          style={{
            fontSize: '0.9rem',
            padding: '0.75rem 1.25rem'
          }}
        >
          💳 View Debit Card & Account Details
        </button>
      </div>
      
      <div>
        <h3 style={{ textAlign: 'left' }}>Current Balance</h3>
        <div style={{ 
          textAlign: 'left', 
          margin: '0 0 2rem 0', 
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '2px solid #e9ecef'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: '#28a745',
                marginBottom: '0.5rem',
                fontFamily: 'monospace'
              }}>
                ${hsaAccount?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#6c757d',
                fontWeight: '500'
              }}>
                Account: {hsaAccount?.account_number || hsaAccount?.accountNumber || 'Not Available'}
              </div>
            </div>
            <button 
              onClick={() => setIsWithdrawModalOpen(true)} 
              className="primary-btn"
              disabled={isWithdrawDisabled}
              style={{
                opacity: isWithdrawDisabled ? 0.5 : 1,
                cursor: isWithdrawDisabled ? 'not-allowed' : 'pointer',
                backgroundColor: isWithdrawDisabled ? '#6c757d' : undefined,
                fontSize: '0.9rem',
                padding: '0.5rem 1rem'
              }}
              title={hsaAccount?.balance <= 0 ? 'No funds available' : undefined}
            >
              💸 Reimburse Expense
            </button>
          </div>
        </div>
      </div>

      <ContributionLimits 
        user={user} 
        refreshTrigger={contributionRefreshTrigger}
        onDepositClick={() => setIsDepositModalOpen(true)}
        isDepositDisabled={isDepositDisabled}
        loading={loading}
      />

      <TransactionHistory 
        transactions={transactions} 
        onRefresh={() => onTransactionHistoryUpdate(user)}
      />

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        user={user}
        hsaAccount={hsaAccount}
        onSuccess={handleDepositSuccess}
        addToast={addToast}
        setLoading={setLoading}
        loading={loading}
      />

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        user={user}
        hsaAccount={hsaAccount}
        onSuccess={handleWithdrawSuccess}
        addToast={addToast}
        setLoading={setLoading}
        loading={loading}
      />


      <AccountDetailsModal
        isOpen={isAccountDetailsModalOpen}
        onClose={() => setIsAccountDetailsModalOpen(false)}
        user={user}
        hsaAccount={hsaAccount}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
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
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#333' }}>Confirm Logout</h3>
            <p style={{ marginBottom: '2rem', color: '#666' }}>
              Are you sure you want to log out of your account?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={handleLogoutCancel} 
                style={{ 
                  background: '#6c757d',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '100px',
                  margin: 0,
                  height: '44px'
                }}
                onMouseOver={(e) => e.target.style.background = '#5a6268'}
                onMouseOut={(e) => e.target.style.background = '#6c757d'}
              >
                Cancel
              </button>
              <button 
                onClick={handleLogoutConfirm} 
                style={{ 
                  background: '#e74c3c',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '100px',
                  margin: 0,
                  height: '44px'
                }}
                onMouseOver={(e) => e.target.style.background = '#c0392b'}
                onMouseOut={(e) => e.target.style.background = '#e74c3c'}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
