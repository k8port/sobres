// app/__tests__/integration/api-upload.spec.ts
import { testApiHandler } from 'next-test-api-route-handler'; // tiny helper
import * as uploadRoute from '../../api/upload/route';
import { it, expect, vi } from 'vitest';

it('forwards PDF and returns parsed payload', async () => {
  // stub backend call
  vi.spyOn(global, 'fetch').mockImplementation(async (url,  init) => {
    if (url === 'http://localhost:8000/api/upload/') {
      return new Response(
        JSON.stringify({ rows: [{ id: 1, amount: 123 }], text: 'OK' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }
    return fetch(url, init);
  })

  await testApiHandler({
    appHandler: uploadRoute,
    async test({ fetch }) {
      const form = new FormData();
      form.append(
        'statement',
        new File(['dummy'], 'bank.pdf', { type: 'application/pdf' }),
      )

      const res = await fetch({ method: 'POST', body: form });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.rows).toHaveLength(1);
    }
  })

})