// app/lib/hooks/useParseStatement.ts

import { useCallback, useMemo, useRef, useState } from 'react';
import { parseUploadById } from '@/app/api/upload/parse/service';

type Status = 'idle' | 'parsing' | 'success' | 'error';

export interface UseParseStatementOptions {
    dedupe?: boolean;
}

export function useParseStatement(options: UseParseStatementOptions = {}) {
    const { dedupe = true } = options;

    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<string | null>(null);
    const [rows, setRows] = useState<Record<string, unknown>[]>([]);
    const [parseResults, setParseResults] = useState<Array<{ uploadId: string; count: number; processedAt: string }>>([]);
    const lastParseId = useRef<string | null>(null);

    const canParse = useMemo(() => status !== 'parsing', [status]);

    const parse = useCallback(async (uploadId: string) => {
        if (!uploadId) {
            setError('No uploadId');
            setStatus('error');
            return;
        }

        if (dedupe && lastParseId.current === uploadId && status === 'success') {
            return;
        }

        setStatus('parsing');
        setError(null);

        const response = await parseUploadById(uploadId);
        const contentType = response.headers.get('content-type') ?? '';
        
        if (!response.ok) {
            let detail = `Parse failed: (${response.status})`;
            if (contentType.includes('application/json')) {
                try {
                    const res = await response.json();
                    if (typeof res?.detail === 'string') detail = res.detail;
                } catch {
                }
            } else {
                try {
                    detail = await response.text();
                } catch {
                }
            }

            setError(detail);
            setStatus('error');
            return;
        }

        try {
            const data = contentType.includes('application/json') ? await response.json() : {};
            const parsedRows = Array.isArray(data?.rows) ? data.rows : [];
            const rowsWithUploadId = parsedRows.map((row: Record<string, unknown>) => ({
                ...row,
                uploadId,
            }));
            setRows(prev => [...prev, ...rowsWithUploadId]);
            setParseResults(prev => [...prev, { uploadId, count: parsedRows.length, processedAt: new Date().toLocaleTimeString() }]);
            setStatus('success');
            lastParseId.current = uploadId;
        } catch (e: any) {
            setStatus('error');
            setError('Invalid JSON from parse endpoint');
        }
    }, [dedupe, status]);

    return { status, error, rows, parse, canParse, parseResults };
}