import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePortal } from '../context/PortalContext';

export const Header: React.FC = () => {
  const { currentRole, setCurrentRole, simulateFailure, setSimulateFailure } = usePortal();
  const location = useLocation();
  const isManager = location.pathname === '/manager' || currentRole === 'manager';

  return (
    <header className="portal-header">
      <div className="header-brand">
        <h1 className="portal-title">Frequent Flyer Portal</h1>
        <span className="portal-subtitle">Airline Operations Floor & Management</span>
      </div>

      <div className="header-actions">
        <nav className="role-nav" aria-label="Role navigation">
          <Link
            to="/"
            className={`nav-link ${!isManager ? 'active' : ''}`}
            onClick={() => setCurrentRole('staff')}
            aria-current={!isManager ? 'page' : undefined}
          >
            Staff
          </Link>
          <Link
            to="/manager"
            className={`nav-link ${isManager ? 'active' : ''}`}
            onClick={() => setCurrentRole('manager')}
            aria-current={isManager ? 'page' : undefined}
          >
            Manager
          </Link>
        </nav>

        <div className="failure-toggle-wrapper">
          <label htmlFor="simulate-failure-toggle" className="toggle-label">
            Simulate Network Failure
          </label>
          <input
            id="simulate-failure-toggle"
            type="checkbox"
            checked={simulateFailure}
            onChange={(e) => setSimulateFailure(e.target.checked)}
            aria-label="Simulate network failure switch"
          />
        </div>
      </div>
    </header>
  );
};
