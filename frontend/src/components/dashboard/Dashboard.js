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
    <div>
      <h3 style={{ marginBottom: '2rem', textAlign: 'left' }}>Welcome back, {user?.name}!</h3>
      
      <div style={{ 
        textAlign: 'center', 
        margin: '2rem 0', 
        padding: '1.5rem',
        backgroundColor: '#f5f2e8',
        borderRadius: '12px',
        border: '2px solid #e9ecef'
      }}>
        <div style={{ 
          fontSize: '1.2rem', 
          color: '#6c757d', 
          marginBottom: '0.5rem',
          fontWeight: '500'
        }}>
          Current Balance
        </div>
        <div style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          color: '#28a745',
          marginBottom: '1rem',
          fontFamily: 'monospace'
        }}>
          ${hsaAccount?.balance?.toFixed(2) || '0.00'}
        </div>
        <div style={{ 
          fontSize: '0.9rem', 
          color: '#6c757d',
          fontWeight: '500'
        }}>
          Account: {hsaAccount?.account_number || hsaAccount?.accountNumber || 'Not Available'}
        </div>
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
