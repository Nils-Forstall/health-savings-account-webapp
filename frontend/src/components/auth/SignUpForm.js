import React, { useState } from 'react';
import { authService } from '../../services/authService';

const SignUpForm = ({ onSuccess, onSwitchToLogin, setMessage, setLoading, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
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
      const user = await authService.createUser(formData.name, formData.email, formData.password);
      setMessage('✅ User account created successfully!');
      onSuccess(user);
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.error || 'Failed to create user'));
    }
    
    setLoading(false);
  };

  return (
    <div className="step-container">
      <h2>Create Your HSA Account</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
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
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      <p style={{ marginTop: '1rem', color: '#666' }}>
        Already have an account?{' '}
        <button 
          onClick={onSwitchToLogin} 
          style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Log in
        </button>
      </p>
    </div>
  );
};

export default SignUpForm;
