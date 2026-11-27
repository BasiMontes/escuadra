import type { ConsentDecision } from '@/platform/consent/cookie';
import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'bun:test';
import { consentCookieName } from '@/platform/consent/cookie';
import { ConsentBanner } from './consent-banner';
import { ConsentProvider } from './consent-provider';
import { ConsentSettingsButton } from './consent-settings-button';
import { Telemetry } from './telemetry';

afterEach(() => {
  document.cookie = `${consentCookieName}=; path=/; max-age=0`;
});

function fakeService() {
  const calls: string[] = [];
  return {
    calls,
    start: async () => void calls.push('start'),
    stop: async () => void calls.push('stop'),
  };
}

function renderConsent({ initial = null, required = true }: { initial?: ConsentDecision | null, required?: boolean } = {}) {
  const errors = fakeService();
  const analytics = fakeService();
  const view = render(
    <ConsentProvider initialDecision={initial} required={required}>
      <Telemetry services={[errors, analytics]} />
      <ConsentSettingsButton />
      <ConsentBanner />
    </ConsentProvider>,
  );
  return { view, errors, analytics };
}

describe('cookie consent', () => {
  test('asks first, and keeps every service stopped until the answer', () => {
    const { view, errors, analytics } = renderConsent();

    expect(view.getByRole('region', { name: 'Cookie consent' })).toBeInTheDocument();
    expect([...errors.calls, ...analytics.calls]).toEqual(['stop', 'stop']);
  });

  test('gives both answers the same weight', () => {
    const { view } = renderConsent();

    expect(view.getByRole('button', { name: 'Accept' }).className).toBe(view.getByRole('button', { name: 'Reject' }).className);
  });

  test('starts the services on yes, remembers it and closes', () => {
    const { view, analytics } = renderConsent();

    fireEvent.click(view.getByRole('button', { name: 'Accept' }));

    expect(analytics.calls).toEqual(['stop', 'start']);
    expect(document.cookie).toContain(`${consentCookieName}=accepted~`);
    expect(view.queryByRole('region', { name: 'Cookie consent' })).toBeNull();
  });

  test('lets the choice be changed later', () => {
    const { view, errors } = renderConsent({ initial: 'accepted' });

    fireEvent.click(view.getByRole('button', { name: 'Cookie settings' }));
    expect(view.getByRole('region', { name: 'Cookie consent' })).toHaveTextContent('You accepted');
    fireEvent.click(view.getByRole('button', { name: 'Reject' }));

    expect(errors.calls).toEqual(['start', 'stop']);
    expect(document.cookie).toContain(`${consentCookieName}=rejected~`);
    expect(view.queryByRole('region', { name: 'Cookie consent' })).toBeNull();
  });

  test('asks nothing when nothing needs consent', () => {
    const { view } = renderConsent({ required: false });

    expect(view.queryByRole('region', { name: 'Cookie consent' })).toBeNull();
    expect(view.queryByRole('button', { name: 'Cookie settings' })).toBeNull();
  });
});
