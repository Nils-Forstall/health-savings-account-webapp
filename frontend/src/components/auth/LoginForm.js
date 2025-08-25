import React, { useState } from 'react';
import { authService } from '../../services/authService';

const LoginForm = ({ onSuccess, onSwitchToSignUp, addToast, setLoading, loading }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await authService.login(formData.email, formData.password);
      addToast('✅ Login successful!', 'success');
      onSuccess(user);
    } catch (error) {
      addToast('❌ ' + (error.response?.data?.error || 'Login failed'), 'error');
    }
    
    setLoading(false);
  };

  return (
    <div className="step-container">
      <h2>Log In</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit" disabled={loading} className="primary-btn">
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      <p style={{ marginTop: '1rem', color: '#666' }}>
        Don't have an account?{' '}
        <button 
          onClick={onSwitchToSignUp} 
          style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Sign up
        </button>
      </p>
    </div>
  );
};

export default LoginForm;
