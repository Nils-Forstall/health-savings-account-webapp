import React, { useState } from 'react';
import { authService } from '../../services/authService';

const LoginForm = ({ onSuccess, onSwitchToSignUp, setMessage, setLoading, loading }) => {
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
    setMessage('');

    try {
      const user = await authService.login(formData.email, formData.password);
      setMessage('✅ Login successful!');
      onSuccess(user);
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.error || 'Login failed'));
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
