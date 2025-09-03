import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navigation = ({ isAuthenticated, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <header className="App-header">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1>🛡️ ForsShield</h1>
            <p>Your Health Savings Account Management Platform</p>
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {location.pathname !== '/simulator' && (
            <Link 
              to="/simulator"
              style={{
                background: '#007bff',
                color: 'white',
                padding: '0.75rem 1.25rem',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              💳 Simulate Transaction
            </Link>
          )}
          {isAuthenticated && location.pathname !== '/dashboard' && (
            <Link 
              to="/dashboard"
              style={{
                background: '#28a745',
                color: 'white',
                padding: '0.75rem 1.25rem',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              🏠 Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navigation;
