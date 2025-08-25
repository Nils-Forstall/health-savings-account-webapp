import React, { useState, useEffect } from 'react';

const InfoTooltip = ({ children, user, contributionLimits }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, arrowLeft: 160 });

  const iconStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#6c757d',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    userSelect: 'none',
    border: '1px solid #adb5bd'
  };

  const getTooltipContent = () => {
    if (!contributionLimits || !user) return '';

    const currentYear = new Date().getFullYear();
    const userAge = user.dateOfBirth ? 
      currentYear - new Date(user.dateOfBirth).getFullYear() : null;
    
    const isFamily = contributionLimits.coverageType === 'family';
    const annualLimit = isFamily ? 8300 : 4150;
    const catchUpEligible = userAge && userAge >= 55;

    let content = `This is your remaining annual HSA contribution limit for ${currentYear}. `;
    content += `You have ${isFamily ? 'family' : 'individual'} coverage with an annual limit of $${annualLimit.toLocaleString()}.`;
    
    if (catchUpEligible) {
      content += ` Since you're 55 or older, you can contribute an additional $1,000 catch-up contribution.`;
    }

    return content;
  };

  const updateTooltipPosition = (iconElement) => {
    if (!iconElement) return;
    
    const rect = iconElement.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 80;
    
    // Position tooltip above the question mark, with arrow pointing to center of icon
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let top = rect.top - tooltipHeight - 8;
    
    // Store the original center position for the arrow
    const iconCenterX = rect.left + rect.width / 2;
    
    // Keep tooltip in viewport horizontally
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10;
    }
    
    // If tooltip would go above viewport, show it below instead
    if (top < 10) {
      top = rect.bottom + 8;
    }
    
    // Calculate arrow position relative to tooltip
    const arrowLeft = iconCenterX - left;
    
    setTooltipPosition({ top, left, arrowLeft });
  };

  const handleMouseEnter = (e) => {
    setIsVisible(true);
    updateTooltipPosition(e.target);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <>
      <span
        style={iconStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        ?
      </span>
      {isVisible && (
        <div
          style={{
            position: 'fixed',
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            zIndex: 10000,
            padding: '12px 16px',
            backgroundColor: '#2c3e50',
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            lineHeight: '1.4',
            width: '320px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            border: '1px solid #34495e',
            pointerEvents: 'none'
          }}
        >
          {getTooltipContent()}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: `${tooltipPosition.arrowLeft}px`,
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid #2c3e50'
            }}
          />
        </div>
      )}
    </>
  );
};

export default InfoTooltip;
