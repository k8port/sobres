// __tests__/setup.integration.ts
import { beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import { ___resetMswData, clearUploadCaptured, clearCaptured, ___resetLastTransactionsBody } from '@/__tests__/test-utils/msw/handlers';
import { onUnhandledRequest } from 'msw';
import { server } from '@/__tests__/test-utils/msw/server';
// If 'undici' types are not available to TypeScript, declare minimal globals
// so the file can compile. At runtime, attempt to require 'undici' and
// fall back to existing globals if present.
declare global {
  // Align with existing DOM/global types when available
  var Blob: typeof globalThis.Blob;
  var File: typeof globalThis.File;
  var FormData: typeof globalThis.FormData;
}

let _Blob: any = (globalThis as any).Blob;
let _File: any = (globalThis as any).File;
let _FormData: any = (globalThis as any).FormData;
try {
  // Use require to avoid TypeScript module resolution errors at compile time
  // if 'undici' is not installed in all environments.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const undici = require('undici');
  _Blob = undici.Blob ?? _Blob;
  _File = undici.File ?? _File;
  _FormData = undici.FormData ?? _FormData;
} catch (e) {
  // ignore — keep existing globals if any
}

globalThis.Blob = _Blob as unknown as typeof globalThis.Blob;
globalThis.File = _File as unknown as typeof globalThis.File;
globalThis.FormData = _FormData as unknown as typeof globalThis.FormData;

let started = false;

// Runs ONLY for the "integration" project (because only that project includes this setup file)
beforeAll(() =>  {
    if (started) return;
    started = true;
    server.listen({ onUnhandledRequest: "error" });
});
  
beforeEach(() => {
  ___resetMswData()
  clearUploadCaptured()
  clearCaptured()
});

afterEach(() => {
  server.resetHandlers()
  ___resetLastTransactionsBody();
});
afterAll(() => server.close());
