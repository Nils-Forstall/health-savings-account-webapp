import React from 'react';

const TransactionHistory = ({ transactions }) => {
  return (
    <div>
      <h3 style={{ textAlign: 'left' }}>Transaction History</h3>
      {transactions.length > 0 ? (
        <div>
          {transactions.map((transaction, index) => (
            <div key={index} style={{ 
              padding: '1rem', 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              marginBottom: '0.5rem',
              backgroundColor: transaction.status === 'APPROVED' ? '#f8f9fa' : '#fff5f5'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {transaction.description || (transaction.amount > 0 ? 'Deposit' : 'Withdrawal')}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    ${transaction.balance_at_time?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontWeight: 'bold',
                    color: transaction.amount > 0 ? '#28a745' : '#dc3545',
                    fontSize: '1.1rem'
                  }}>
                    {transaction.amount < 0 ? '-' : ''}${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#666' }}>No transactions yet</p>
      )}
    </div>
  );
};

export default TransactionHistory;
