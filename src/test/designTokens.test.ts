import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Design System Tokens', () => {
  const tokensPath = path.resolve(__dirname, '../styles/tokens.css');
  const srcDir = path.resolve(__dirname, '..');

  it('defines all required strict monochromatic corporate color tokens and spacing tokens', () => {
    expect(fs.existsSync(tokensPath)).toBe(true);
    const content = fs.readFileSync(tokensPath, 'utf-8');

    // Required color tokens
    expect(content).toMatch(/--color-white:\s*#FFFFFF/i);
    expect(content).toMatch(/--color-gray-50:\s*#F5F5F5/i);
    expect(content).toMatch(/--color-gray-200:\s*#E5E5E5/i);
    expect(content).toMatch(/--color-gray-400:\s*#A3A3A3/i);
    expect(content).toMatch(/--color-gray-600:\s*#737373/i);
    expect(content).toMatch(/--color-gray-800:\s*#404040/i);
    expect(content).toMatch(/--color-gray-900:\s*#171717/i);
    expect(content).toMatch(/--color-error:\s*#B00020/i);

    // Required spacing tokens (16px increments)
    expect(content).toMatch(/--space-1:\s*16px/);
    expect(content).toMatch(/--space-2:\s*32px/);
    expect(content).toMatch(/--space-3:\s*48px/);
  });

  it('ensures no hex colors exist anywhere in src/ outside tokens.css', () => {
    const hexRegex = /#([0-9a-fA-F]{3,8})\b/g;
    const violations: { file: string; line: number; match: string }[] = [];

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (
          /\.(css|tsx|ts|jsx|js|html)$/.test(entry.name) &&
          !fullPath.endsWith(path.normalize('styles/tokens.css')) &&
          !fullPath.endsWith(path.normalize('test/designTokens.test.ts'))
        ) {
          const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');
          lines.forEach((line, idx) => {
            // Ignore comments in test/code if any
            const matches = line.match(hexRegex);
            if (matches) {
              matches.forEach((m) => {
                violations.push({
                  file: path.relative(srcDir, fullPath),
                  line: idx + 1,
                  match: m,
                });
              });
            }
          });
        }
      }
    }

    scanDir(srcDir);

    expect(
      violations,
      `Found unauthorized hex color codes outside tokens.css: ${JSON.stringify(violations, null, 2)}`
    ).toHaveLength(0);
  });
});
