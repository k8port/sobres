import { POST as transactionsPostRoute } from '@/app/api/transactions/route';
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

describe('/api/transactions proxy auth forwarding', () => {
  it('adds dev identity header when missing so update-transactions does not 401 in dev', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const headers = new Headers(init?.headers as HeadersInit | undefined);
      expect(headers.get('x-user-id')).toBe('dev-user-1');

      return new Response(JSON.stringify({ count: 2 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    try {
      const request = new NextRequest('http://localhost/api/transactions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify([{ id: 1 }, { id: 2 }]),
      });

      const response = await transactionsPostRoute(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({ count: 2 });
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('preserves explicit user identity header when present', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const headers = new Headers(init?.headers as HeadersInit | undefined);
      expect(headers.get('x-user-id')).toBe('custom-user-99');

      return new Response(JSON.stringify({ count: 1 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    try {
      const request = new NextRequest('http://localhost/api/transactions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-user-id': 'custom-user-99',
        },
        body: JSON.stringify([{ id: 42 }]),
      });

      const response = await transactionsPostRoute(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({ count: 1 });
    } finally {
      fetchMock.mockRestore();
    }
  });
});
