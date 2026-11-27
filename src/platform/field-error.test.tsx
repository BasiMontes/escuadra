import { render } from '@testing-library/react';
import { describe, expect, test } from 'bun:test';
import { FieldError } from './ui/field';

describe('FieldError (written by the shadcn CLI)', () => {
  test('shows each distinct message once', () => {
    const view = render(<FieldError errors={[{ message: 'Required' }, { message: 'Required' }, { message: 'Too short' }]} />);

    expect(view.getAllByRole('listitem').map(item => item.textContent)).toEqual(['Required', 'Too short']);
  });
});
