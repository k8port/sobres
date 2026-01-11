import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getEnvelopes, createEnvelope } from '@/app/api/envelopes/service';
import { render, screen } from '@testing-library/react';
import EnvelopesPage from '@/app/envelopes/page';
import useSWR from "swr";
import { ___resetMswData } from '@/__tests__/test-utils/msw/handlers';

vi.mock('swr', () => ({ default: vi.fn() }));

describe('/envelopes page', () => {
    it ('renders envelope cards from /api/envelopes/response', () => {
        (useSWR as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            data: {
                categories: [
                    { id: 1, name: 'Rent', percentage: 50, balance: 1000 },
                    { id: 2, name: 'Food', percentage: 10, balance: 120.5 },
                ],
            },
        });

        render(<EnvelopesPage />);

        expect(screen.getByText('Envelope Balances')).toBeInTheDocument();
        expect(screen.getByText('Rent')).toBeInTheDocument();
        expect(screen.getByText('Food')).toBeInTheDocument();
        expect(screen.getByText(/Allocation: 50%/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Balance:/i)).toHaveLength(2);
    })
});

describe('API contract: /api/envelopes', () => {
    beforeEach(() => ___resetMswData);

    it('GET /api/envelopes -> { categories: [{ id, name, monthlyAmount? }] }', async () => {
        const data = await getEnvelopes();
        expect(Array.isArray(data.categories)).toBe(true);
        expect(data.categories[0]).toEqual(expect.objectContaining({ id: expect.any(String), name: expect.any(String) }));
    });

    it('POST /api/envelopes body { name, monthlyAmount? } -> created envelope', async () => {
        const created = await createEnvelope({ name: 'Utilities', monthlyAmount: 200 });
        expect(created).toEqual(expect.objectContaining({ id: expect.any(String), name: 'Utilities' }));

        const after = await getEnvelopes();
        expect(after.categories.some((c) => c.id === created.id)).toBe(true);
    });
});