import { describe, expect, test } from 'bun:test';
import { notifyUser } from './notify';
import { fakeStore, record } from './testing';

const notification = { title: 'Hello', body: 'World', url: '/account' };

describe('notifyUser', () => {
  test('sends to every device of that user and to nobody else', async () => {
    const { store } = fakeStore([record(), record({ endpoint: 'two' }), record({ userId: 'user-2', endpoint: 'other' })]);
    const sent: string[] = [];

    const result = await notifyUser({ userId: 'user-1', notification, store, sender: async ({ target, payload }) => {
      sent.push(`${target.endpoint} ${payload}`);
      return 'sent';
    } });

    expect(result).toEqual({ sent: 2, removed: 0, failed: 0 });
    expect(sent).toHaveLength(2);
    expect(sent.join()).not.toContain('other');
    expect(sent[0]).toContain(JSON.stringify(notification));
  });

  test('forgets a device that is gone, and one failure does not stop the rest', async () => {
    const { rows, store } = fakeStore([record({ endpoint: 'gone' }), record({ endpoint: 'broken' }), record({ endpoint: 'fine' })]);
    const original = console.error;
    const logged: unknown[] = [];
    console.error = (...args: unknown[]) => void logged.push(...args);

    const result = await notifyUser({ userId: 'user-1', notification, store, sender: async ({ target }) => {
      if (target.endpoint === 'broken') { throw new Error('service down'); }
      return target.endpoint === 'gone' ? 'gone' : 'sent';
    } });
    console.error = original;

    expect(result).toEqual({ sent: 1, removed: 1, failed: 1 });
    expect([...rows.keys()]).toEqual(['broken', 'fine']);
    expect(logged.join()).toContain('service down');
  });
});
