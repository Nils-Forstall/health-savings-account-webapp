import React, { useState } from 'react';
import Modal from '../common/Modal';
import { hsaService } from '../../services/hsaService';

const DepositModal = ({ isOpen, onClose, user, onSuccess, setMessage, setLoading, loading }) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await hsaService.deposit(user.userId, amount);
      setMessage(`✅ Deposit successful! New balance: $${response.newBalance.toFixed(2)}`);
      setAmount('');
      onSuccess(response.newBalance);
      onClose();
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.error || 'Deposit failed'));
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Deposit Money">
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Amount ($):</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={handleClose} className="secondary-btn">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="primary-btn">
            {loading ? 'Processing...' : 'Deposit'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DepositModal;
