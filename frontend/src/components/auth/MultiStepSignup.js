import React, { useState } from 'react';
import BasicInfoForm from './BasicInfoForm';
import HSADetailsForm from './HSADetailsForm';
import { authService } from '../../services/authService';

const MultiStepSignup = ({ onSuccess, onSwitchToLogin, addToast, setLoading, loading }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    coverageType: 'individual',
    insuranceProvider: '',
    insuranceCardFront: '',
    insuranceCardBack: '',
    hasHDHP: false,
    noGovernmentInsurance: false,
    noHealthcareFSA: false,
    notDependent: false
  });

  const handleNext = () => {
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const user = await authService.createUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth,
        coverageType: formData.coverageType,
        insuranceProvider: formData.insuranceProvider,
        insuranceCardFront: formData.insuranceCardFront,
        insuranceCardBack: formData.insuranceCardBack,
        hasHDHP: formData.hasHDHP,
        noGovernmentInsurance: formData.noGovernmentInsurance,
        noHealthcareFSA: formData.noHealthcareFSA,
        notDependent: formData.notDependent
      });
      addToast('✅ Account created successfully!', 'success');
      onSuccess(user);
    } catch (error) {
      addToast('❌ ' + (error.response?.data?.error || 'Failed to create account'), 'error');
    }
    
    setLoading(false);
  };

  return (
    <>
      {currentStep === 1 && (
        <BasicInfoForm
          formData={formData}
          setFormData={setFormData}
          onNext={handleNext}
          onSwitchToLogin={onSwitchToLogin}
        />
      )}
      
      {currentStep === 2 && (
        <HSADetailsForm
          formData={formData}
          setFormData={setFormData}
          onBack={handleBack}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}
    </>
  );
};

export default MultiStepSignup;
