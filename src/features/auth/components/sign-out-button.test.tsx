import { fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'bun:test';
import { renderWithRouter } from '../../../../test/render-with-router';
import { SignOutButton } from './sign-out-button';

describe('SignOutButton', () => {
  test('signs out and goes to the sign-in page', async () => {
    const view = renderWithRouter(<SignOutButton auth={{ signOut: async () => ({ error: null }) }} />);

    fireEvent.click(view.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(view.visited).toEqual(['/login']));
  });

  test('says so when the session could not be closed', async () => {
    const view = renderWithRouter(<SignOutButton auth={{ signOut: async () => ({ error: {} }) }} />);

    fireEvent.click(view.getByRole('button', { name: 'Sign out' }));

    expect(await view.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(view.visited).toEqual([]);
  });
});
