import React, { useState, useEffect } from 'react';
import { hsaService } from '../../services/hsaService';
import ContributionLimitsModal from './ContributionLimitsModal';

const ContributionLimits = ({ user, refreshTrigger, onDepositClick, isDepositDisabled, loading }) => {
  const [contributionData, setContributionData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchContributionLimits = async () => {
      if (!user?.userId) return;
      
      try {
        setDataLoading(true);
        const response = await hsaService.getContributionLimits(user.userId);
        setContributionData(response);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch contribution limits:', err);
        setError('Failed to load contribution limits');
      } finally {
        setDataLoading(false);
      }
    };

    fetchContributionLimits();
  }, [user?.userId, refreshTrigger]);

  if (dataLoading) {
    return (
      <div style={{ 
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '2px solid #e9ecef',
        textAlign: 'center'
      }}>
        <div style={{ color: '#6c757d' }}>Loading contribution limits...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '2px solid #e9ecef',
        textAlign: 'center'
      }}>
        <div style={{ color: '#dc3545' }}>{error}</div>
      </div>
    );
  }

  if (!contributionData) return null;

  const {
    remainingLimit,
    annualLimit,
    currentContributions,
    catchUpEligible,
    catchUpAmount,
    coverageType,
    year
  } = contributionData;

  const contributionPercentage = ((currentContributions / annualLimit) * 100).toFixed(0);
  const remainingPercentage = ((remainingLimit / annualLimit) * 100).toFixed(0);

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        marginBottom: '0.5rem'
      }}>
        <h3 style={{ textAlign: 'left', margin: 0 }}>Remaining Contribution Limits</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: 'none',
            border: '2px solid #007bff',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#007bff',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#007bff';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#007bff';
          }}
          title="Learn about HSA contribution limits"
        >
          ?
        </button>
      </div>
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
          marginBottom: '1.5rem'
        }}>
          <div>
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#6c757d',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}>
              {year} HSA Contribution Room
            </div>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: remainingLimit > 0 ? '#28a745' : '#dc3545',
              marginBottom: '0.5rem',
              fontFamily: 'monospace'
            }}>
              ${remainingLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#6c757d',
              fontWeight: '500'
            }}>
              {remainingLimit > 0 && `${remainingPercentage}% of annual limit available`}
              {remainingLimit <= 0 && 'Annual contribution limit reached'}
            </div>
          </div>
          <button 
            onClick={onDepositClick} 
            className="primary-btn"
            disabled={isDepositDisabled}
            style={{
              opacity: isDepositDisabled ? 0.5 : 1,
              cursor: isDepositDisabled ? 'not-allowed' : 'pointer',
              backgroundColor: isDepositDisabled ? '#6c757d' : undefined,
              fontSize: '0.9rem',
              padding: '0.5rem 1rem'
            }}
            title={remainingLimit <= 0 ? 'Annual contribution limit reached' : undefined}
          >
            💰 Deposit Money
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
              Progress: {contributionPercentage}%
            </span>
            <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
              ${currentContributions.toLocaleString()} / ${annualLimit.toLocaleString()}
            </span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#e9ecef', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${Math.min(contributionPercentage, 100)}%`, 
              height: '100%', 
              backgroundColor: contributionPercentage >= 100 ? '#dc3545' : '#28a745',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Additional Details */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1rem',
          fontSize: '0.85rem',
          color: '#6c757d',
          marginBottom: '1rem'
        }}>
          <div>
            <strong>Coverage:</strong> {coverageType === 'family' ? 'Family' : 'Individual'}
          </div>
          <div>
            <strong>Annual Limit:</strong> ${annualLimit.toLocaleString()}
          </div>
          {catchUpEligible && (
            <>
              <div>
                <strong>Catch-up Eligible:</strong> Yes (55+)
              </div>
              <div>
                <strong>Catch-up Amount:</strong> ${catchUpAmount.toLocaleString()}
              </div>
            </>
          )}
        </div>

        {/* Warning if near or over limit */}
        {remainingLimit <= 1000 && remainingLimit > 0 && (
          <div style={{ 
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '6px',
            fontSize: '0.85rem',
            color: '#856404'
          }}>
            ⚠️ You're approaching your annual contribution limit
          </div>
        )}

        {remainingLimit <= 0 && (
          <div style={{ 
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            fontSize: '0.85rem',
            color: '#721c24'
          }}>
            🚫 You've reached your annual contribution limit
          </div>
        )}
      </div>

      <ContributionLimitsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contributionData={contributionData}
        user={user}
      />
    </div>
  );
};

export default ContributionLimits;
