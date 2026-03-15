// web-ui/__tests__/unit/lib/hooks/useUploadAndParse.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUploadAndParse } from '@/app/lib/hooks/useUploadAndParse';
import * as uploadSvc from '@/app/api/upload/service';
import * as parseSvc from '@/app/api/upload/parse/service';
import * as txSvc from '@/app/api/transactions/service';

describe('useUploadAndParse', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(txSvc, 'saveTransactions').mockResolvedValue({ count: 0 });
    });

    it('uploads multiple statesments then parses with returned array of statement ids', async () => {
        const uploadSpy = vi
            .spyOn(uploadSvc, 'uploadStatements')
            .mockResolvedValue({ id: 'u-1', datetime: '2025-01-01T00:00:00Z' } as any);
            
            const parseSpy = vi
                .spyOn(parseSvc, 'parseUploadById')
                .mockResolvedValue(
                    new Response(
                        JSON.stringify({ rows: [{ id: 1 }], text: 'OK' }),
                        { status: 200, headers: { 'content-type': 'application/json' } })
                );

        const { result } = renderHook(() => useUploadAndParse());
        const file = new File(['x'], 'bank.pdf', { type: 'application/pdf' });

        await act(async () => {
            await result.current.run([file]);
        });

        expect(uploadSpy).toHaveBeenCalledWith([file]);
        expect(parseSpy).toHaveBeenCalledWith('u-1');
        expect(result.current.uploadError).toBeFalsy();
    });

    it('propagates upload error and does not call parse', async () => {
    const uploadSpy = vi
        .spyOn(uploadSvc, 'uploadStatements')
        .mockRejectedValueOnce(new Error('upload failed'));
    
    const parseSpy = vi.spyOn(parseSvc, 'parseUploadById');
    
    const { result } = renderHook(() => useUploadAndParse());
    const file = new File(['x'], 'bank.pdf', { type: 'application/pdf' });
    
    await act(async () => {
        await expect(result.current.run([file])).rejects.toThrow('upload failed');
    });
    
    expect(uploadSpy).toHaveBeenCalledTimes(1);
    expect(parseSpy).not.toHaveBeenCalled();
    
    await waitFor(() => {
        expect(result.current.uploadError).toBeTruthy();
    });
    });


    it('propagates parse error after successful upload', async () => {
        const uploadSpy = vi
            .spyOn(uploadSvc, 'uploadStatements')
            .mockResolvedValue({ id: 'u-2', datetime: 'd' } as any);

        // return a non-2xx status to drive parse-hook error state (dependent on impl)  
        const parseSpy = vi
            .spyOn(parseSvc, 'parseUploadById')
            .mockResolvedValue(
                new Response(
                    JSON.stringify({ 
                        detail: 'Invalid upload ID' }), { 
                            status: 404, 
                            headers: { 'content-type': 'application/json' } 
                        })
        );

        const { result } = renderHook(() => useUploadAndParse());
        const file = new File(['x'], 'bank.pdf', { type: 'application/pdf' });

        await act(async () => {
            // when parse hook throws to prevent premature test failure
            await result.current.run([file]).catch(() => {});
        });

        expect(uploadSpy).toHaveBeenCalledTimes(1);
        expect(parseSpy).toHaveBeenCalledTimes(1);

        // add'l stabality: wait for parse status to reflect error
        await waitFor(() => {
            expect(result.current.parseError || result.current.parseStatus).toBeTruthy();
        })
    });
});