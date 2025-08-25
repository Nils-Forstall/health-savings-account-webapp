import React from 'react';

const TransactionHistory = ({ transactions }) => {
  return (
    <div>
      <h3>Transaction History</h3>
      {transactions.length > 0 ? (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {transactions.map((transaction, index) => (
            <div key={index} style={{ 
              padding: '1rem', 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              marginBottom: '0.5rem',
              backgroundColor: transaction.status === 'APPROVED' ? '#f8f9fa' : '#fff5f5'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>{transaction.merchant}</strong></span>
                <span style={{ color: transaction.amount > 0 ? 'green' : 'red' }}>
                  ${Math.abs(transaction.amount).toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {transaction.description} • {new Date(transaction.created_at).toLocaleDateString()}
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
