import React, { useState, useEffect } from 'react';

const InfoTooltip = ({ children, user, contributionLimits }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, arrowLeft: 160, isBelow: false });

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
    const isFamily = contributionLimits.coverageType === 'family';
    
    // Determine catch-up eligibility from backend field or infer from limits
    let catchUpEligible = contributionLimits.catchUpEligible;
    if (catchUpEligible === undefined && contributionLimits.annualLimit) {
      // Infer catch-up eligibility from the annual limit amount
      const expectedBaseLimit = isFamily ? 8550 : 4300; // 2025 base limits
      catchUpEligible = contributionLimits.annualLimit > expectedBaseLimit;
    }
    
    // Fallback logic for baseLimit if not provided by backend
    let baseAnnualLimit = contributionLimits.baseLimit;
    if (!baseAnnualLimit && contributionLimits.annualLimit) {
      // Calculate base limit from total limit if baseLimit is missing
      baseAnnualLimit = catchUpEligible ? contributionLimits.annualLimit - 1000 : contributionLimits.annualLimit;
    }
    
    // Safety check
    if (!baseAnnualLimit) {
      return 'Unable to load contribution limit information.';
    }

    let content = `You have an annual HSA contribution limit of $${contributionLimits.annualLimit.toLocaleString()} for ${currentYear}.`;
    
    // if (catchUpEligible && contributionLimits.annualLimit) {
    //   content += `\n\nSince you're 55 or older by the end of ${currentYear}, you can contribute an additional $1,000 for a total of $${contributionLimits.annualLimit.toLocaleString()}.`;
    // }

    return content;
  };

  const updateTooltipPosition = (iconElement) => {
    if (!iconElement) return;
    
    const rect = iconElement.getBoundingClientRect();
    const tooltipWidth = 320;
    
    // Calculate content height dynamically based on text length
    const content = getTooltipContent();
    const lineHeight = 1.4;
    const fontSize = 14;
    const padding = 24; // 12px top + 12px bottom
    const charsPerLine = Math.floor(tooltipWidth / (fontSize * 0.6)); // Approximate chars per line
    const estimatedLines = Math.ceil(content.length / charsPerLine);
    const tooltipHeight = Math.max(60, estimatedLines * fontSize * lineHeight + padding);
    
    // Store the original center position for the arrow
    const iconCenterX = rect.left + rect.width / 2;
    
    // Position tooltip above the question mark (anchored at bottom, growing upward)
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let top = rect.top - tooltipHeight - 8;
    
    // Keep tooltip in viewport horizontally
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10;
    }
    
    // Keep tooltip in viewport vertically - if it would go above viewport, position it below
    let isBelow = false;
    if (top < 10) {
      top = rect.bottom + 8;
      isBelow = true;
    }
    
    // Calculate arrow position relative to tooltip
    const arrowLeft = iconCenterX - left;
    
    setTooltipPosition({ top, left, arrowLeft, isBelow });
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
            maxWidth: '320px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            border: '1px solid #34495e',
            pointerEvents: 'none',
            whiteSpace: 'pre-line'
          }}
        >
          {getTooltipContent()}
          <div
            style={{
              position: 'absolute',
              top: tooltipPosition.isBelow ? '-8px' : '100%',
              left: `${tooltipPosition.arrowLeft}px`,
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              ...(tooltipPosition.isBelow 
                ? { borderBottom: '8px solid #2c3e50' }
                : { borderTop: '8px solid #2c3e50' }
              )
            }}
          />
        </div>
      )}
    </>
  );
};

export default InfoTooltip;
