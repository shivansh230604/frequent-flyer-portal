import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from '../App';

describe('Criterion 1 & 2 & 3: Happy Path', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, 'Test', '/');
  });

  describe('Criterion 1: Portal Interface Rendering & Primary Task', () => {
    it('renders the portal interface clearly with headings, role switcher, and a primary task on Staff view', async () => {
      render(<App />);

      // Must have main heading
      const mainHeading = screen.getByRole('heading', {
        level: 1,
        name: /frequent flyer portal/i,
      });
      expect(mainHeading).toBeInTheDocument();

      // Must have Staff / Manager role switcher in header
      const roleSwitcher = screen.getByRole('navigation', { name: /role switcher|role navigation/i });
      expect(roleSwitcher).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /staff/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /manager/i })).toBeInTheDocument();

      // Must have search input for staff floor operations
      const searchInput = screen.getByRole('searchbox', { name: /search members/i });
      expect(searchInput).toBeInTheDocument();

      // Must have primary task button (Add Member)
      const primaryTaskBtn = screen.getByRole('button', { name: /add member/i });
      expect(primaryTaskBtn).toBeInTheDocument();
    });
  });

  describe('Criterion 2: Input Responsiveness for Local Interactions', () => {
    it('responds immediately to text input without blocking loading screens or input freezes', async () => {
      const user = userEvent.setup();
      render(<App />);

      const searchInput = screen.getByRole('searchbox', { name: /search members/i });

      // Typing in local search input must immediately reflect without blocking spinner
      await user.type(searchInput, 'SkyWalker');
      expect(searchInput).toHaveValue('SkyWalker');

      // Must not display a blocking loading indicator during local text input
      const blockingLoader = screen.queryByRole('status', { name: /blocking-loader/i });
      expect(blockingLoader).not.toBeInTheDocument();
      expect(searchInput).not.toBeDisabled();
    });
  });

  describe('Criterion 3: Manager Consistent Data Structure', () => {
    it('renders manager dashboard with consistent data model metrics, table structure, and activity log', async () => {
      window.history.pushState({}, 'Manager View', '/manager');
      render(<App />);

      // Heading for Manager Dashboard
      const managerHeading = screen.getByRole('heading', {
        name: /manager dashboard/i,
      });
      expect(managerHeading).toBeInTheDocument();

      // Key metrics consistent with data model
      expect(screen.getByTestId('metric-total-members')).toBeInTheDocument();
      expect(screen.getByTestId('metric-tier-breakdown')).toBeInTheDocument();
      expect(screen.getByTestId('metric-points-summary')).toBeInTheDocument();

      // Table with accessible <th scope="col"> headers
      const table = screen.getByRole('table', { name: /frequent flyer members/i });
      expect(table).toBeInTheDocument();

      const headers = screen.getAllByRole('columnheader');
      const headerNames = headers.map((th) => th.textContent?.trim().toLowerCase());
      expect(headerNames).toContain('name');
      expect(headerNames).toContain('email');
      expect(headerNames).toContain('tier');
      expect(headerNames).toContain('points');
      expect(headerNames).toContain('join date');

      // Verify <th scope="col"> attributes
      headers.forEach((th) => {
        expect(th).toHaveAttribute('scope', 'col');
      });

      // Recent activity log
      const activityLog = screen.getByRole('region', { name: /recent activity log/i });
      expect(activityLog).toBeInTheDocument();
    });
  });
});
