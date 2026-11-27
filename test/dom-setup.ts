import { GlobalRegistrator } from '@happy-dom/global-registrator';
import * as matchers from '@testing-library/jest-dom/matchers';
import { afterEach, beforeEach, expect } from 'bun:test';

const url = 'https://app.test/';

// Server code is tested too, and the DOM versions of these refuse headers such as `cookie`.
const native = { fetch: globalThis.fetch, Headers: globalThis.Headers, Request: globalThis.Request, Response: globalThis.Response };

function registerDom() {
  GlobalRegistrator.register({ url });
  Object.assign(globalThis, native);
}

registerDom();

// On CI runners the preload's window does not always survive to the test files.
beforeEach(async () => {
  if (typeof globalThis.window !== 'undefined') { return; }
  if (GlobalRegistrator.isRegistered) { await GlobalRegistrator.unregister(); }
  registerDom();
});

expect.extend(matchers);

// Testing Library binds `document` when it loads, so it must load after the registration above.
// eslint-disable-next-line ts/no-require-imports -- a static import would be hoisted above the registration
const { cleanup } = require('@testing-library/react') as typeof import('@testing-library/react');

afterEach(() => { cleanup(); });
