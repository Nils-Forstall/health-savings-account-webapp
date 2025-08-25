import React, { useState } from 'react';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import TransactionHistory from './TransactionHistory';

const Dashboard = ({ 
  user, 
  hsaAccount, 
  transactions, 
  onBalanceUpdate, 
  onTransactionHistoryUpdate,
  setMessage, 
  setLoading, 
  loading 
}) => {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const handleDepositSuccess = (newBalance) => {
    onBalanceUpdate(newBalance);
    onTransactionHistoryUpdate();
  };

  const handleWithdrawSuccess = (newBalance) => {
    onBalanceUpdate(newBalance);
    onTransactionHistoryUpdate();
  };

  return (
    <div className="step-container">
      <h2>HSA Dashboard</h2>
      
      <div className="info-card">
        <h3>Welcome back, {user?.name}!</h3>
        <p><strong>Account Number:</strong> {hsaAccount?.account_number}</p>
        <p><strong>Current Balance:</strong> ${hsaAccount?.balance?.toFixed(2) || '0.00'}</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', justifyContent: 'center' }}>
        <button 
          onClick={() => setIsDepositModalOpen(true)} 
          className="primary-btn"
          disabled={loading}
        >
          💰 Deposit Money
        </button>
        <button 
          onClick={() => setIsWithdrawModalOpen(true)} 
          className="primary-btn"
          disabled={loading}
        >
          💸 Withdraw Money
        </button>
      </div>

      <TransactionHistory transactions={transactions} />

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        user={user}
        onSuccess={handleDepositSuccess}
        setMessage={setMessage}
        setLoading={setLoading}
        loading={loading}
      />

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        user={user}
        onSuccess={handleWithdrawSuccess}
        setMessage={setMessage}
        setLoading={setLoading}
        loading={loading}
      />
    </div>
  );
};

export default Dashboard;
