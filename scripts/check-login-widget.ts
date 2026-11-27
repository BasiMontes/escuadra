/**
 * Does the Turnstile widget render on `/login`? The test suites run without captcha, so a wrong site key or a
 * policy that blocks Cloudflare would lock everyone out with every check green. It needs no credentials and writes
 * nothing.
 *
 *   bun scripts/check-login-widget.ts <base-url>
 *
 * Exit 0 = rendered, 1 = not rendered (with the reason), 2 = the check itself broke.
 */

import { chromium } from '@playwright/test';

const WIDGET_TIMEOUT_MS = 30_000;
const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';

export interface WidgetVerdict {
  ok: boolean
  reasons: string[]
}

export interface WidgetObservation {
  turnstileApiLoaded: boolean
  responseInputCount: number
  iframeCount: number
  blockedRequests: string[]
  cspViolations: string[]
}

// Either a response input or a Cloudflare frame proves it rendered: a silent check shows no frame.
export function judgeWidget(observed: WidgetObservation): WidgetVerdict {
  const reasons: string[] = [];
  if (!observed.turnstileApiLoaded) {
    reasons.push(`window.turnstile is not defined: the script from ${TURNSTILE_ORIGIN} did not load or run`);
  }
  if (observed.responseInputCount === 0 && observed.iframeCount === 0) {
    reasons.push(`the widget container stayed empty for ${WIDGET_TIMEOUT_MS / 1000}s: no cf-turnstile-response input and no ${TURNSTILE_ORIGIN} iframe, so it was never rendered`);
  }
  for (const request of observed.blockedRequests) { reasons.push(`request to Cloudflare failed: ${request}`); }
  for (const violation of observed.cspViolations) { reasons.push(`Content-Security-Policy: ${violation}`); }
  return { ok: reasons.length === 0, reasons };
}

async function main(): Promise<number> {
  const base = process.argv[2]?.replace(/\/$/, '');
  if (!base) {
    console.error('Usage: bun scripts/check-login-widget.ts <base-url>');
    return 2;
  }
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const blockedRequests: string[] = [];
    const cspViolations: string[] = [];
    page.on('requestfailed', (request) => {
      if (request.url().startsWith(TURNSTILE_ORIGIN)) { blockedRequests.push(`${request.url()} (${request.failure()?.errorText ?? 'failed'})`); }
    });
    page.on('console', (message) => {
      // Cloudflare's own feature probe fetches `data:,` and trips connect-src on every page: not a failure.
      const text = message.text();
      if (message.type() === 'error' && /content security policy|refused to (?:load|frame)/i.test(text) && !/'data:,'|load data:,/i.test(text)) { cspViolations.push(text.slice(0, 300)); }
    });

    const response = await page.goto(`${base}/login`, { waitUntil: 'load' });
    if (!response || !response.ok()) {
      console.error(`[login-widget] ${base}/login answered ${response?.status() ?? 'nothing'}`);
      return 1;
    }

    const rendered = `[data-testid="captcha_widget"] input[name="cf-turnstile-response"], iframe[src^="${TURNSTILE_ORIGIN}"]`;
    await page.waitForSelector(rendered, { state: 'attached', timeout: WIDGET_TIMEOUT_MS }).catch(() => {});
    const observed: WidgetObservation = {
      turnstileApiLoaded: await page.evaluate(() => typeof (window as unknown as { turnstile?: unknown }).turnstile === 'object'),
      responseInputCount: await page.locator('[data-testid="captcha_widget"] input[name="cf-turnstile-response"]').count(),
      iframeCount: await page.locator(`iframe[src^="${TURNSTILE_ORIGIN}"]`).count(),
      blockedRequests,
      cspViolations,
    };

    const verdict = judgeWidget(observed);
    if (verdict.ok) {
      console.log(`[login-widget] OK: the Turnstile widget rendered on ${base}/login (response input: ${observed.responseInputCount}, iframes: ${observed.iframeCount}).`);
      return 0;
    }
    console.error(`[login-widget] FAIL on ${base}/login:\n${verdict.reasons.map(reason => `- ${reason}`).join('\n')}`);
    return 1;
  }
  finally {
    await browser.close();
  }
}

if (import.meta.main) {
  main().then(code => process.exit(code), (error) => {
    console.error('[login-widget] the check itself failed:', error);
    process.exit(2);
  });
}
