import { describe, expect, test } from 'bun:test';
import { judgeWidget } from './check-login-widget.ts';

const painted = { turnstileApiLoaded: true, responseInputCount: 1, iframeCount: 0, blockedRequests: [], cspViolations: [] };

describe('judgeWidget', () => {
  test('accepts a rendered widget, with or without a visible frame', () => {
    expect(judgeWidget(painted).ok).toBe(true);
    expect(judgeWidget({ ...painted, responseInputCount: 0, iframeCount: 1 }).ok).toBe(true);
  });

  test.each([
    [{ turnstileApiLoaded: false }, 'did not load'],
    [{ responseInputCount: 0 }, 'never rendered'],
    [{ blockedRequests: ['x'] }, 'failed'],
    [{ cspViolations: ['frame-src'] }, 'Content-Security-Policy'],
  ])('fails on %p', (change, reason) => {
    const verdict = judgeWidget({ ...painted, ...change });

    expect(verdict.ok).toBe(false);
    expect(verdict.reasons.join('\n')).toContain(reason);
  });
});
