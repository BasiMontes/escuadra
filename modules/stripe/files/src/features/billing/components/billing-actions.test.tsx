import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'bun:test';
import { BillingActions } from './billing-actions';

function answering(status: number, body: object) {
  const asked: string[] = [];
  const send = async (url: string) => {
    asked.push(url);
    return Response.json(body, { status });
  };
  return { asked, send };
}

describe('BillingActions', () => {
  test('goes to the address Stripe gave', async () => {
    const visited: string[] = [];
    const api = answering(200, { url: 'https://checkout.stripe.test/session' });
    const view = render(<BillingActions canSubscribe canManage={false} send={api.send} go={url => void visited.push(url)} />);

    fireEvent.click(view.getByRole('button', { name: 'Subscribe' }));

    await waitFor(() => expect(visited).toEqual(['https://checkout.stripe.test/session']));
    expect(api.asked).toEqual(['/api/stripe/checkout']);
    expect(view.queryByRole('button', { name: 'Manage subscription' })).toBeNull();
  });

  test.each([
    [503, 'Payments are not available yet.'],
    [409, 'You already have a subscription.'],
    [500, 'Something went wrong.'],
  ])('explains a %p answer', async (status, message) => {
    const view = render(<BillingActions canSubscribe canManage send={answering(status, {}).send} go={() => {}} />);

    fireEvent.click(view.getByRole('button', { name: 'Manage subscription' }));

    expect(await view.findByRole('alert')).toHaveTextContent(message);
  });
});
