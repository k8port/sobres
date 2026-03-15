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
    const [parseResults, setParseResults] = useState<Array<{ uploadId: string; count: number; processedAt: string; error?: string }>>([]);
    const parsedUploadIds = useRef<Set<string>>(new Set());

    const canParse = useMemo(() => status !== 'parsing', [status]);

    const parse = useCallback(async (uploadId: string) => {
        if (!uploadId) {
            setError('No uploadId');
            setStatus('error');
            throw new Error('No uploadId');
        }

        // Deduplication: skip if already parsed successfully
        if (dedupe && parsedUploadIds.current.has(uploadId)) {
            return;
        }

        setStatus('parsing');
        setError(null);

        try {
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
                setParseResults(prev => [...prev, { uploadId, count: 0, processedAt: new Date().toLocaleTimeString(), error: detail }]);
                setStatus('error');
                throw new Error(detail);
            }

            const data = contentType.includes('application/json') ? await response.json() : {};
            const parsedRows = Array.isArray(data?.rows) ? data.rows : [];
            
            // Add uploadId to rows for tracking which upload they came from
            const rowsWithUploadId = parsedRows.map((row: Record<string, unknown>) => ({
                ...row,
                uploadId: row.uploadId || uploadId, // Use existing uploadId if present, otherwise use the current one
            }));

            // Only add new transactions (deduplicate based on uploadId + id combination)
            setRows(prev => {
                const existingIds = new Set(
                    prev
                        .filter((r: Record<string, unknown>) => r.uploadId === uploadId)
                        .map((r: Record<string, unknown>) => r.id)
                );
                const newRows = rowsWithUploadId.filter((r: Record<string, unknown>) => !existingIds.has(r.id));
                return [...prev, ...newRows];
            });

            setParseResults(prev => [...prev, { uploadId, count: parsedRows.length, processedAt: new Date().toLocaleTimeString() }]);
            setStatus('success');
            parsedUploadIds.current.add(uploadId);
        } catch (e: any) {
            const errMsg = e instanceof Error ? e.message : 'Invalid JSON from parse endpoint';
            setStatus('error');
            setError(errMsg);
            setParseResults(prev => [...prev, { uploadId, count: 0, processedAt: new Date().toLocaleTimeString(), error: errMsg }]);
            throw e;
        }
    }, [dedupe]);

    return { status, error, rows, parse, canParse, parseResults };
}