import React from 'react';
import { hsaService } from '../../services/hsaService';

const HSAApplication = ({ user, onSuccess, addToast, setLoading, loading }) => {
  const handleCreateHSA = async () => {
    setLoading(true);

    try {
      const hsaAccount = await hsaService.createHSA(user.userId);
      addToast('✅ HSA account created successfully!', 'success');
      onSuccess(hsaAccount);
    } catch (error) {
      addToast('❌ Failed to create HSA account', 'error');
    }
    
    setLoading(false);
  };

  return (
    <div className="step-container">
      <h2>Apply for HSA Account</h2>
      <div className="info-card">
        <h3>Welcome, {user?.name}!</h3>
        <p>You don't have an HSA account yet. Would you like to apply for one?</p>
        <p><small>HSAs provide tax advantages for medical expenses</small></p>
      </div>
      <button onClick={handleCreateHSA} disabled={loading} className="primary-btn">
        {loading ? 'Creating HSA...' : 'Apply for HSA Account'}
      </button>
    </div>
  );
};

export default HSAApplication;
