import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PortalProvider, usePortal } from './context/PortalContext';
import { Header } from './components/Header';
import { StaffPortal } from './components/StaffPortal';
import { ManagerDashboard } from './components/ManagerDashboard';
import './styles/tokens.css';
import './index.css';

const PortalAppContent: React.FC = () => {
  const { isLoading, error, retryLastAction } = usePortal();

  return (
    <div className="portal-container">
      <Header />

      {/* Global Async Loading Indicator */}
      {isLoading && (
        <div
          className="portal-loader"
          role="status"
          aria-label="Loading portal data"
          aria-live="polite"
        >
          <div className="spinner" aria-hidden="true" />
          <span className="loader-text">Loading frequent flyer data...</span>
        </div>
      )}

      {/* Global Error Banner with Retry */}
      {error && (
        <aside
          className="portal-error-alert"
          role="alert"
          aria-live="assertive"
        >
          <div className="alert-content">
            <span className="alert-icon" aria-hidden="true">⚠️</span>
            <span className="alert-message">{error}</span>
          </div>
          <button
            type="button"
            className="btn btn-retry"
            onClick={retryLastAction}
            aria-label="Retry failed operation"
          >
            Retry
          </button>
        </aside>
      )}

      <Routes>
        <Route path="/" element={<StaffPortal />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="*" element={<StaffPortal />} />
      </Routes>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <PortalProvider>
        <PortalAppContent />
      </PortalProvider>
    </BrowserRouter>
  );
};

export default App;
