import React from 'react';
import { useNavigate } from 'react-router-dom';
import MultiStepSignup from '../components/auth/MultiStepSignup';

const HomePage = ({ onAuthSuccess, addToast, setLoading, loading }) => {
  const navigate = useNavigate();

  return (
    <MultiStepSignup
      onSuccess={onAuthSuccess}
      onSwitchToLogin={() => navigate('/login')}
      addToast={addToast}
      setLoading={setLoading}
      loading={loading}
    />
  );
};

export default HomePage;
