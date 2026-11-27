import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, test } from 'bun:test';

const source = readFileSync(`${import.meta.dir}/../../../public/sw.js`, 'utf8');
const origin = 'https://app.test';

interface Shown { title: string, body: string, data: { url: string } }
type Listener = (event: object) => void;

function load(openTabs: string[] = []) {
  const listeners = new Map<string, Listener>();
  const shown: Shown[] = [];
  const opened: string[] = [];
  const focused: string[] = [];
  runInNewContext(source, {
    URL,
    location: { origin },
    addEventListener: (name: string, listener: Listener) => listeners.set(name, listener),
    registration: { showNotification: async (title: string, options: Omit<Shown, 'title'>) => void shown.push({ title, ...options }) },
    clients: {
      matchAll: async () => openTabs.map(url => ({ url, focus: async () => void focused.push(url) })),
      openWindow: async (url: string) => void opened.push(url),
    },
  });
  async function dispatch(name: string, event: object) {
    let work: Promise<unknown> | undefined;
    listeners.get(name)!({ ...event, waitUntil: (promise: Promise<unknown>) => { work = promise; } });
    await work;
  }
  const push = async (json: () => unknown) => dispatch('push', { data: { json } });
  const tap = async (url?: string) => dispatch('notificationclick', { notification: { close: () => {}, data: { url } } });
  return { shown, opened, focused, push, tap };
}

describe('service worker', () => {
  test('shows what arrives', async () => {
    const worker = load();

    await worker.push(() => ({ title: 'Hello', body: 'World', url: '/account' }));

    expect(JSON.parse(JSON.stringify(worker.shown))).toEqual([{ title: 'Hello', body: 'World', data: { url: '/account' } }]);
  });

  test('still shows something when the message cannot be read', async () => {
    const worker = load();

    await worker.push(() => {
      throw new SyntaxError('not JSON');
    });

    expect(worker.shown[0]?.title).toBe('Notification');
  });

  test('focuses the tab already on that page', async () => {
    const worker = load([`${origin}/account`]);

    await worker.tap('/account');

    expect(worker.focused).toEqual([`${origin}/account`]);
    expect(worker.opened).toEqual([]);
  });

  test('opens the page otherwise', async () => {
    const worker = load([`${origin}/other`]);

    await worker.tap('/account');

    expect(worker.opened).toEqual([`${origin}/account`]);
  });

  test.each(['https://evil.test/x', '//evil.test/x', undefined])('never leaves the app for %p', async (url) => {
    const worker = load();

    await worker.tap(url);

    expect(worker.opened).toEqual([`${origin}/`]);
  });
});
