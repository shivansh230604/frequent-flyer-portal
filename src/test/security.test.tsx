import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from '../App';
import { sanitizeInput } from '../utils/sanitize';

describe('Criterion 9: Security & DOMPurify Input Sanitization', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, 'Test', '/');
  });

  describe('sanitizeInput utility', () => {
    it('neutralizes "<script>alert(1)</script>" and removes script tags', () => {
      const malicious = '<script>alert(1)</script>SafeText';
      const clean = sanitizeInput(malicious);

      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert(1)');
      expect(clean).toContain('SafeText');
    });

    it('neutralizes "<img onerror=...>" and strips malicious event handlers', () => {
      const malicious = '<img src="x" onerror="alert(document.cookie)" />Captain';
      const clean = sanitizeInput(malicious);

      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('Captain');
    });

    it('neutralizes javascript pseudo-protocol links', () => {
      const malicious = '<a href="javascript:alert(1)">Click me</a>';
      const clean = sanitizeInput(malicious);

      expect(clean).not.toContain('javascript:');
    });

    it('preserves clean corporate inputs without distortion', () => {
      const normalName = "John O'Connor";
      expect(sanitizeInput(normalName)).toBe("John O'Connor");
    });
  });

  describe('UI Integration: DOMPurify Sanitization Before Storing in State', () => {
    it('sanitizes input before persisting to state/storage when creating a member', async () => {
      const user = userEvent.setup();
      render(<App />);

      const addBtn = await screen.findByRole('button', { name: /add member/i });
      await user.click(addBtn);

      const nameInput = screen.getByRole('textbox', { name: /full name/i });
      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const submitBtn = screen.getByRole('button', { name: /submit|save member/i });

      // Enter malicious payloads
      await user.type(nameInput, '<script>alert(1)</script>John Wick');
      await user.type(emailInput, 'john.wick@airline.com');
      await user.click(submitBtn);

      // Verify stored data in localStorage has no <script> tag
      const rawStored = localStorage.getItem('frequent_flyer_members');
      expect(rawStored).toBeTruthy();
      if (rawStored) {
        expect(rawStored).not.toContain('<script>');
        expect(rawStored).not.toContain('alert(1)');
        expect(rawStored).toContain('John Wick');
      }
    });
  });
});
