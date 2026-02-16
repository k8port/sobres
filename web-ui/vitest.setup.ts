import { resetInterceptors } from './__tests__/test-utils/msw/server';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { handlers } from './__tests__/test-utils/msw/handlers';

// Ensure fetch + MSW see the same classes
(globalThis as any).Blob ??= Blob;
(globalThis as any).File ??= File;
(globalThis as any).FormData ??= FormData;


(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
export const server = setupServer(...handlers);

// console.log('is fetch mocked? ', !!(globalThis.fetch as any)?.mock);
// console.log('fetch name: ', (globalThis.fetch as any)?.name);

// minimal File polyfill for Node test envs
if (typeof File === 'undefined') {
    class NodeFile extends Blob {
        name: string;
        lastModified: number;
        constructor(chunks: any[], name: string, options: any = {}) {
            super(chunks as any, options);
            this.name = String(name);
            this.lastModified = typeof options?.lastModified === 'number'
                ? options.lastModified
                : Date.now();
        }
    }
    (globalThis as any).File = NodeFile as any;
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
    cleanup(); // <-- critical
    vi.restoreAllMocks(); // <-- prevents fetch spies leakage
    server.resetHandlers();
    resetInterceptors();
});
afterAll(() => server.close());