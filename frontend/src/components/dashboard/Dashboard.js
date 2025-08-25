import React, { useState, useEffect } from 'react';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
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
  loading 
}) => {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [contributionRefreshTrigger, setContributionRefreshTrigger] = useState(0);
  const [contributionLimits, setContributionLimits] = useState(null);

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

  // Check if deposits should be disabled
  const isDepositDisabled = loading || (contributionLimits && contributionLimits.remainingLimit <= 0);

  return (
    <div>
      <h2 style={{ marginBottom: '2rem', textAlign: 'left' }}>
        {user?.isFirstLogin ? `Welcome, ${user?.name}!` : `Welcome back, ${user?.name}!`}
      </h2>
      
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
              disabled={loading}
              style={{
                fontSize: '0.9rem',
                padding: '0.5rem 1rem'
              }}
            >
              💸 Withdraw Money
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

      <TransactionHistory transactions={transactions} />

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
    </div>
  );
};

export default Dashboard;
