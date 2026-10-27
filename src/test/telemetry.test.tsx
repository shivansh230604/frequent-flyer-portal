import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from '../App';
import { logTelemetry } from '../utils/telemetry';

describe('Criterion 8: Telemetry (NFR)', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, 'Test', '/');
    vi.restoreAllMocks();
  });

  it('formats telemetry messages matching "[Analytics] User interacted with End-to-End Frequent Flyer Portal: <action_name>"', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    logTelemetry('add_member', { memberId: '123' });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[Analytics\] User interacted with End-to-End Frequent Flyer Portal: add_member/i),
      expect.anything()
    );
  });

  it('triggers telemetry log upon completing add member primary action in the UI', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<App />);

    // Open add member
    const addBtn = await screen.findByRole('button', { name: /add member/i });
    await user.click(addBtn);

    // Fill valid form
    await user.type(screen.getByRole('textbox', { name: /full name/i }), 'Alice Walker');
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'alice@airline.com');
    await user.click(screen.getByRole('button', { name: /submit|save member/i }));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[Analytics\] User interacted with End-to-End Frequent Flyer Portal: add_member/i),
      expect.anything()
    );
  });

  it('triggers telemetry log upon completing points logging primary action', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<App />);

    // Trigger log points modal
    const logPointsBtn = await screen.findByRole('button', { name: /log points/i });
    await user.click(logPointsBtn);

    await user.type(screen.getByRole('spinbutton', { name: /points amount/i }), '500');
    await user.click(screen.getByRole('button', { name: /confirm|submit points/i }));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[Analytics\] User interacted with End-to-End Frequent Flyer Portal: (earn_points|redeem_points|log_points)/i),
      expect.anything()
    );
  });
});
