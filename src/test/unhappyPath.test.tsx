import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from '../App';

describe('Criterion 4 & 5 & 6: Unhappy Path', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, 'Test', '/');
  });

  describe('Criterion 4: Empty States & Search Misses', () => {
    it('shows a friendly "No data found" message when search yields no matches, never a blank screen', async () => {
      const user = userEvent.setup();
      render(<App />);

      const searchInput = await screen.findByRole('searchbox', { name: /search members/i });
      await user.type(searchInput, 'NonExistentMemberXYZ999');

      const noDataMessage = await screen.findByText(/no data found/i);
      expect(noDataMessage).toBeInTheDocument();
      expect(noDataMessage).toBeVisible();

      // Ensure the container is not empty or blank
      const memberListContainer = screen.getByTestId('member-list-container');
      expect(memberListContainer).not.toBeEmptyDOMElement();
    });

    it('shows a friendly "No data found" message when the portal has zero members', async () => {
      // Simulate empty storage
      localStorage.setItem('frequent_flyer_members', JSON.stringify([]));
      render(<App />);

      const noDataMessage = await screen.findByText(/no data found/i);
      expect(noDataMessage).toBeInTheDocument();
    });
  });

  describe('Criterion 5: Async Loading Indicators and Error Retry', () => {
    it('shows a visible loading indicator during async operations', async () => {
      render(<App />);

      // A visible loading indicator must be present while async data operation is in flight
      const loader = screen.getByRole('status', { name: /loading/i });
      expect(loader).toBeInTheDocument();
      expect(loader).toBeVisible();
    });

    it('displays a clear error message with a retry button when an async operation fails, and retrying re-attempts', async () => {
      const user = userEvent.setup();
      // Set the simulated failure switch in storage or mock layer
      localStorage.setItem('frequent_flyer_simulate_failure', 'true');
      render(<App />);

      // Must display a clear error message with role="alert"
      const alert = await screen.findByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/failed|error/i);

      // Must display a visible retry button
      const retryBtn = screen.getByRole('button', { name: /retry/i });
      expect(retryBtn).toBeInTheDocument();

      // Disable failure simulation and click retry
      localStorage.setItem('frequent_flyer_simulate_failure', 'false');
      await user.click(retryBtn);

      // Error message should disappear upon successful retry
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Criterion 6: Form Validation & Accessible Error Feedback', () => {
    it('blocks submission with missing/malformed data, sets aria-invalid, and shows visible error text not relying on color alone', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Open Add Member Modal
      const addBtn = await screen.findByRole('button', { name: /add member/i });
      await user.click(addBtn);

      const submitBtn = screen.getByRole('button', { name: /submit|save member/i });
      const nameInput = screen.getByRole('textbox', { name: /full name/i });
      const emailInput = screen.getByRole('textbox', { name: /email address/i });

      // Fill malformed email and leave name empty
      await user.type(emailInput, 'invalid-email-format');
      await user.click(submitBtn);

      // Both inputs must have aria-invalid="true"
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');

      // Must display visible descriptive error text (not color alone)
      const nameError = screen.getByText(/name is required/i);
      expect(nameError).toBeInTheDocument();
      expect(nameError).toBeVisible();

      const emailError = screen.getByText(/valid email is required/i);
      expect(emailError).toBeInTheDocument();
      expect(emailError).toBeVisible();

      // Error must be linked via aria-describedby or have role="alert"
      const nameDescribedBy = nameInput.getAttribute('aria-describedby');
      expect(nameDescribedBy).toBeTruthy();
      if (nameDescribedBy) {
        expect(document.getElementById(nameDescribedBy)).toHaveTextContent(/name is required/i);
      }
    });
  });
});
