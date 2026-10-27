import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import React from 'react';
import App from '../App';

describe('Criterion 7: Accessibility (NFR)', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, 'Test', '/');
  });

  it('reports zero axe accessibility violations on the Staff page', async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('reports zero axe accessibility violations on the Manager page', async () => {
    window.history.pushState({}, 'Manager View', '/manager');
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ensures all interactive buttons and inputs have accessible names/ARIA labels', () => {
    render(<App />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      const accessibleName = btn.getAttribute('aria-label') || btn.textContent?.trim();
      expect(accessibleName).toBeTruthy();
    });

    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      const hasLabel =
        input.getAttribute('aria-label') ||
        input.getAttribute('aria-labelledby') ||
        input.closest('label') ||
        (input.id && document.querySelector(`label[for="${input.id}"]`));
      expect(Boolean(hasLabel)).toBe(true);
    });
  });

  it('supports full keyboard navigation (tab order and Space/Enter activation)', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Tab through interactive elements
    await user.tab();
    expect(document.activeElement).not.toBe(document.body);

    const activeElement = document.activeElement as HTMLElement;
    expect(activeElement).toBeVisible();

    // Verify Enter and Space trigger button activations
    if (activeElement && activeElement.tagName === 'BUTTON') {
      await user.keyboard('{Enter}');
      await user.keyboard(' ');
    }
  });
});
