import React from 'react';
import Modal from '../common/Modal';

const ContributionLimitsModal = ({ isOpen, onClose, contributionData, user }) => {
  if (!contributionData) return null;

  const {
    annualLimit = 0,
    baseLimit = 0,
    catchUpEligible = false,
    catchUpAmount = 0,
    coverageType = 'individual',
    year = new Date().getFullYear()
  } = contributionData;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="HSA Contribution Limits Explained">
      <div style={{ lineHeight: '1.6', color: '#333' }}>
        <h4 style={{ marginTop: '0', marginBottom: '1rem', color: '#007bff' }}>
          Your {year} HSA Contribution Limits
        </h4>
        
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
            <div>
              <strong>Coverage Type:</strong> {coverageType === 'family' ? 'Family' : 'Individual'}
            </div>
            <div>
              <strong>Base Limit:</strong> ${baseLimit.toLocaleString()}
            </div>
            <div>
              <strong>Catch-up Eligible:</strong> {catchUpEligible ? 'Yes (55+)' : 'No'}
            </div>
            <div>
              <strong>Total Annual Limit:</strong> ${annualLimit.toLocaleString()}
            </div>
          </div>
        </div>

        <h5 style={{ marginBottom: '0.75rem', color: '#495057' }}>How Your Limits Are Calculated</h5>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 0.75rem 0' }}>
            <strong>Base Contribution Limit ({year}):</strong>
          </p>
          <ul style={{ margin: '0 0 1rem 1.5rem', paddingLeft: '0' }}>
            <li>Individual coverage: $4,300</li>
            <li>Family coverage: $8,550</li>
          </ul>
          <p style={{ margin: '0', fontSize: '0.85rem', color: '#6c757d' }}>
            Your limit is <strong>${baseLimit.toLocaleString()}</strong> because you have <strong>{coverageType}</strong> coverage.
          </p>
        </div>

        {catchUpEligible && (
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ margin: '0 0 0.75rem 0' }}>
              <strong>Catch-up Contribution:</strong>
            </p>
            <p style={{ margin: '0 0 0.75rem 0' }}>
              Since you're 55 or older, you're eligible for an additional <strong>${catchUpAmount.toLocaleString()}</strong> catch-up contribution.
            </p>
            <p style={{ margin: '0', fontSize: '0.85rem', color: '#6c757d' }}>
              Total limit: ${baseLimit.toLocaleString()} + ${catchUpAmount.toLocaleString()} = <strong>${annualLimit.toLocaleString()}</strong>
            </p>
          </div>
        )}

        <h5 style={{ marginBottom: '0.75rem', color: '#495057' }}>Important Notes</h5>
        
        <ul style={{ margin: '0 0 1.5rem 1.5rem', paddingLeft: '0' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            These limits are set annually by the IRS and may change each year
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            Contributions must be made by the tax filing deadline (typically April 15th)
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            Catch-up contributions are available if you turn 55 by December 31st of the contribution year
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            Exceeding contribution limits may result in tax penalties
          </li>
        </ul>

        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#e7f3ff', 
          borderRadius: '8px', 
          border: '1px solid #b3d9ff',
          fontSize: '0.85rem'
        }}>
          <strong>💡 Pro Tip:</strong> HSA contributions are tax-deductible, grow tax-free, and can be withdrawn tax-free for qualified medical expenses, making HSAs one of the most tax-advantaged accounts available.
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button onClick={onClose} className="primary-btn">
            Got it!
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ContributionLimitsModal;
