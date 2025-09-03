import React from 'react';
import { useNavigate } from 'react-router-dom';
import CardSimulatorPage from '../components/simulator/CardSimulatorPage';

const SimulatorPage = ({ addToast, setLoading, loading, isAuthenticated }) => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <CardSimulatorPage
      addToast={addToast}
      setLoading={setLoading}
      loading={loading}
      onBackToHome={handleBackToHome}
    />
  );
};

export default SimulatorPage;
