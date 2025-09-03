import React from 'react';
import Dashboard from '../components/dashboard/Dashboard';

const DashboardPage = ({ 
  user, 
  hsaAccount, 
  transactions, 
  onBalanceUpdate, 
  onTransactionHistoryUpdate, 
  addToast, 
  setLoading, 
  loading 
}) => {
  return (
    <Dashboard
      user={user}
      hsaAccount={hsaAccount}
      transactions={transactions}
      onBalanceUpdate={onBalanceUpdate}
      onTransactionHistoryUpdate={onTransactionHistoryUpdate}
      addToast={addToast}
      setLoading={setLoading}
      loading={loading}
    />
  );
};

export default DashboardPage;
