import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = ({ onAuthSuccess, addToast, setLoading, loading }) => {
  const navigate = useNavigate();

  return (
    <LoginForm
      onSuccess={onAuthSuccess}
      onSwitchToSignUp={() => navigate('/')}
      addToast={addToast}
      setLoading={setLoading}
      loading={loading}
    />
  );
};

export default LoginPage;
