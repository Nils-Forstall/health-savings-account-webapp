import React, { useState } from 'react';

const HSADetailsForm = ({ formData, setFormData, onBack, onSubmit, loading }) => {
  const [errors, setErrors] = useState({});

  const insuranceProviders = [
    'Blue Cross Blue Shield',
    'Aetna',
    'Cigna',
    'UnitedHealthcare',
    'Kaiser Permanente',
    'Humana',
    'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    setFormData({
      ...formData,
      [name]: file ? file.name : ''
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    
    if (!formData.insuranceProvider) {
      newErrors.insuranceProvider = 'Please select an insurance provider';
    }
    
    // if (!formData.insuranceCardFront) {
    //   newErrors.insuranceCardFront = 'Please upload front of insurance card';
    // }
    
    // if (!formData.insuranceCardBack) {
    //   newErrors.insuranceCardBack = 'Please upload back of insurance card';
    // }
    
    if (!formData.hasHDHP) {
      newErrors.hasHDHP = 'You must have a High Deductible Health Plan to be eligible for an HSA';
    }
    
    if (!formData.noGovernmentInsurance) {
      newErrors.noGovernmentInsurance = 'You must not be enrolled in government insurance programs to be eligible for an HSA';
    }
    
    if (!formData.noHealthcareFSA) {
      newErrors.noHealthcareFSA = 'You must not have a healthcare FSA to be eligible for an HSA';
    }
    
    if (!formData.notDependent) {
      newErrors.notDependent = 'You must not be claimed as a dependent to be eligible for an HSA';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit();
    }
  };

  return (
    <div className="step-container">
      <h2>HSA Account Details</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Step 2 of 2: Health Savings Account Information</p>
      
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Date of Birth:</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            required
          />
          {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
        </div>
        
        <div className="form-group">
          <label>Coverage Type:</label>
          <select
            name="coverageType"
            value={formData.coverageType}
            onChange={handleInputChange}
            required
          >
            <option value="individual">Individual</option>
            <option value="family">Family</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Insurance Provider:</label>
          <select
            name="insuranceProvider"
            value={formData.insuranceProvider}
            onChange={handleInputChange}
            required
          >
            <option value="">Select your insurance provider</option>
            {insuranceProviders.map(provider => (
              <option key={provider} value={provider}>{provider}</option>
            ))}
          </select>
          {errors.insuranceProvider && <span className="error-text">{errors.insuranceProvider}</span>}
        </div>
        
        <div className="form-group">
          <label>Insurance Card - Front:</label>
          <input
            type="file"
            name="insuranceCardFront"
            onChange={handleFileChange}
            accept="image/*"
          />
          {formData.insuranceCardFront && (
            <p style={{ color: '#28a745', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              ✓ {formData.insuranceCardFront}
            </p>
          )}
          {errors.insuranceCardFront && <span className="error-text">{errors.insuranceCardFront}</span>}
        </div>
        
        <div className="form-group">
          <label>Insurance Card - Back:</label>
          <input
            type="file"
            name="insuranceCardBack"
            onChange={handleFileChange}
            accept="image/*"
          />
          {formData.insuranceCardBack && (
            <p style={{ color: '#28a745', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              ✓ {formData.insuranceCardBack}
            </p>
          )}
          {errors.insuranceCardBack && <span className="error-text">{errors.insuranceCardBack}</span>}
        </div>
        
        <div className="form-group">
          <h3 style={{ marginBottom: '1rem', color: '#333' }}>HSA Eligibility Confirmation</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Please confirm that you meet all HSA eligibility requirements:
          </p>
          
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hasHDHP"
                checked={formData.hasHDHP}
                onChange={handleInputChange}
                required
              />
              <span className="checkmark"></span>
              My health plan is a High Deductible Health Plan (HDHP)
            </label>
            {errors.hasHDHP && <span className="error-text">{errors.hasHDHP}</span>}
          </div>
          
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="noGovernmentInsurance"
                checked={formData.noGovernmentInsurance}
                onChange={handleInputChange}
                required
              />
              <span className="checkmark"></span>
              I am not enrolled in Medicare, Medicaid, TRICARE, or Children's Health Insurance Program (CHIP)
            </label>
            {errors.noGovernmentInsurance && <span className="error-text">{errors.noGovernmentInsurance}</span>}
          </div>
          
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="noHealthcareFSA"
                checked={formData.noHealthcareFSA}
                onChange={handleInputChange}
                required
              />
              <span className="checkmark"></span>
              Neither I nor my spouse have a healthcare Flexible Spending Account (FSA)
            </label>
            {errors.noHealthcareFSA && <span className="error-text">{errors.noHealthcareFSA}</span>}
          </div>
          
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="notDependent"
                checked={formData.notDependent}
                onChange={handleInputChange}
                required
              />
              <span className="checkmark"></span>
              I cannot be claimed as a dependent on someone else's tax return
            </label>
            {errors.notDependent && <span className="error-text">{errors.notDependent}</span>}
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '2rem' }}>
          <button type="button" onClick={onBack} className="secondary-btn">
            Back
          </button>
          <button type="submit" disabled={loading} className="primary-btn">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HSADetailsForm;
