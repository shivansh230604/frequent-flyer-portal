import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from '../App';
import { MEMBERS_KEY, FAILURE_KEY } from '../services/mockApi';

describe('Modal Regression & Data-Integrity Tests', { timeout: 30000 }, () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, 'Test', '/');
  });

  it('failed save persists nothing', async () => {
    const user = userEvent.setup({ delay: null });
    render(<App />);

    // Wait for initial render to load seed members
    await screen.findByRole('button', { name: /add member/i });
    const initialRaw = localStorage.getItem(MEMBERS_KEY);
    const initialMembers = initialRaw ? JSON.parse(initialRaw) : [];
    const initialCount = initialMembers.length;

    // Enable network failure simulation
    localStorage.setItem(FAILURE_KEY, 'true');

    // Open Add Member modal
    const addBtn = screen.getByRole('button', { name: /add member/i });
    await user.click(addBtn);
    await screen.findByRole('dialog');

    // Fill in valid details
    fireEvent.change(screen.getByRole('textbox', { name: /full name/i }), {
      target: { value: 'Arthur Dent' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email address/i }), {
      target: { value: 'arthur@galaxy.com' },
    });

    // Submit form
    const saveBtn = screen.getByRole('button', { name: /save member/i });
    await user.click(saveBtn);

    // In-modal error alert must appear
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/failed|error/i);

    // Stored members in localStorage must NOT have changed
    const currentMembers = JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]');
    expect(currentMembers).toHaveLength(initialCount);
    expect(currentMembers.some((m: { name: string }) => m.name === 'Arthur Dent')).toBe(false);
  });

  it('retry creates exactly one member', async () => {
    const user = userEvent.setup({ delay: null });
    render(<App />);

    await screen.findByRole('button', { name: /add member/i });

    // Enable network failure
    localStorage.setItem(FAILURE_KEY, 'true');

    // Open Add Member modal
    await user.click(screen.getByRole('button', { name: /add member/i }));
    await screen.findByRole('dialog');

    // Fill form
    fireEvent.change(screen.getByRole('textbox', { name: /full name/i }), {
      target: { value: 'Ford Prefect' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email address/i }), {
      target: { value: 'ford@galaxy.com' },
    });

    // Click Save Member (will fail)
    await user.click(screen.getByRole('button', { name: /save member/i }));

    // Wait for Retry button inside modal
    const retryBtn = await screen.findByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();

    // Turn off network failure
    localStorage.setItem(FAILURE_KEY, 'false');

    // Click Retry inside the modal
    await user.click(retryBtn);

    // Modal should close on success
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Check directory and storage for Ford Prefect
    expect(await screen.findByText('Ford Prefect')).toBeInTheDocument();
    const storedMembers = JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]');
    const matching = storedMembers.filter((m: { name: string }) => m.name === 'Ford Prefect');
    expect(matching).toHaveLength(1);
  });

  it('repeated clicks create one member', async () => {
    const user = userEvent.setup({ delay: null });
    render(<App />);

    await screen.findByRole('button', { name: /add member/i });
    await user.click(screen.getByRole('button', { name: /add member/i }));
    await screen.findByRole('dialog');

    fireEvent.change(screen.getByRole('textbox', { name: /full name/i }), {
      target: { value: 'Trillian Astra' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email address/i }), {
      target: { value: 'trillian@galaxy.com' },
    });

    const saveBtn = screen.getByRole('button', { name: /save member/i });
    // Click rapidly multiple times
    await Promise.all([
      user.click(saveBtn),
      user.click(saveBtn),
      user.click(saveBtn),
    ]);

    // Modal closes on success
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Verify exactly one entry was created
    const storedMembers = JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]');
    const matching = storedMembers.filter((m: { name: string }) => m.name === 'Trillian Astra');
    expect(matching).toHaveLength(1);
  });

  it('closing the modal resets state', async () => {
    const user = userEvent.setup({ delay: null });
    render(<App />);

    await screen.findByRole('button', { name: /add member/i });

    // Enable network failure
    localStorage.setItem(FAILURE_KEY, 'true');

    // Open modal and fill data
    await user.click(screen.getByRole('button', { name: /add member/i }));
    await screen.findByRole('dialog');

    fireEvent.change(screen.getByRole('textbox', { name: /full name/i }), {
      target: { value: 'Zaphod Beeblebrox' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email address/i }), {
      target: { value: 'zaphod@galaxy.com' },
    });

    // Save and fail
    await user.click(screen.getByRole('button', { name: /save member/i }));
    await screen.findByRole('alert');

    // Close via Cancel button
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);

    // Modal is closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Reopen Add Member modal
    await user.click(screen.getByRole('button', { name: /add member/i }));
    await screen.findByRole('dialog');

    // Verify fields and error alert are reset
    expect(screen.getByRole('textbox', { name: /full name/i })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /email address/i })).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Escape closes the modal', async () => {
    const user = userEvent.setup({ delay: null });
    render(<App />);

    // Test Add Member modal with Escape
    const addBtn = await screen.findByRole('button', { name: /add member/i });
    await user.click(addBtn);
    const memberModal = await screen.findByRole('dialog');
    expect(memberModal).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Test Log Points modal with Escape
    const logPointsBtn = screen.getByRole('button', { name: /log points/i });
    await user.click(logPointsBtn);
    const pointsModal = await screen.findByRole('dialog');
    expect(pointsModal).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
