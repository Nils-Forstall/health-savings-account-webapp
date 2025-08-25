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
    <Modal isOpen={isOpen} onClose={onClose} title="HSA Contribution Limits">
      <div style={{ lineHeight: '1.5', color: '#333', textAlign: 'left' }}>
        {/* Main Contribution Limit Display */}
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: '#f8fffe', 
          borderRadius: '12px', 
          marginBottom: '2rem',
          border: '2px solid #10b981',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            margin: '0 0 0.5rem 0', 
            fontSize: '2rem', 
            fontWeight: '700',
            color: '#065f46'
          }}>
            ${annualLimit.toLocaleString()}
          </h2>
          <p style={{ 
            margin: '0', 
            fontSize: '1.1rem', 
            color: '#047857',
            fontWeight: '500'
          }}>
            Your {year} Annual Contribution Limit
          </p>
          {catchUpEligible && (
            <p style={{ 
              margin: '0.5rem 0 0 0', 
              fontSize: '0.9rem', 
              color: '#059669'
            }}>
              Includes $1,000 catch-up contribution (age 55+)
            </p>
          )}
        </div>

        {/* Breakdown Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1.3rem', 
            fontWeight: '600',
            color: '#1f2937'
          }}>
            How This Amount is Calculated
          </h3>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: '500', color: '#374151' }}>
                Base Limit ({coverageType === 'family' ? 'Family' : 'Individual'} Coverage)
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                {year} IRS limit for {coverageType} coverage
              </div>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#1f2937' }}>
              ${baseLimit.toLocaleString()}
            </div>
          </div>

          {catchUpEligible && (
            <>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: '500', color: '#92400e' }}>
                    Catch-up Contribution
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#a16207', marginTop: '0.25rem' }}>
                    Available because you're 55 or older
                  </div>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#92400e' }}>
                  +${catchUpAmount.toLocaleString()}
                </div>
              </div>
              
              <div style={{ 
                borderTop: '2px solid #e5e7eb',
                paddingTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937' }}>
                  Total Annual Limit
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#065f46' }}>
                  ${annualLimit.toLocaleString()}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Key Information */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1.3rem', 
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Key Information
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gap: '0.75rem',
            fontSize: '0.95rem',
            lineHeight: '1.4'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <span style={{ color: '#ef4444', marginRight: '0.5rem', fontWeight: 'bold' }}>⚠️</span>
              <span>Contributions must be made by tax filing deadline (typically April 15th)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <span style={{ color: '#f59e0b', marginRight: '0.5rem', fontWeight: 'bold' }}>📅</span>
              <span>Catch-up eligibility based on turning 55 by December 31st of contribution year</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <span style={{ color: '#ef4444', marginRight: '0.5rem', fontWeight: 'bold' }}>💰</span>
              <span>Exceeding limits may result in tax penalties</span>
            </div>
          </div>
        </div>

        {/* Pro Tip */}
        <div style={{ 
          padding: '1.25rem', 
          backgroundColor: '#eff6ff', 
          borderRadius: '8px', 
          border: '1px solid #3b82f6',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem', marginRight: '0.75rem' }}>💡</span>
            <div>
              <div style={{ fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>
                Triple Tax Advantage
              </div>
              <div style={{ fontSize: '0.9rem', color: '#1e40af' }}>
                HSA contributions are tax-deductible, grow tax-free, and withdrawals for qualified medical expenses are tax-free.
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <button onClick={onClose} className="primary-btn">
            Got it!
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ContributionLimitsModal;
