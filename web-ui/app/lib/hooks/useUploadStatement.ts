// /app/lib/hooks/useUploadStatement.ts

import { useState } from 'react';
import { uploadStatement, uploadStatements } from '@/app/api/upload/service';
import type { UploadStoredResponse } from '@/app/lib/types';

type UploadReturn = UploadStoredResponse[];

export function useUploadStatement() {
    const [uploadResult, setUploadResult] = useState<UploadStoredResponse[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const normalizeOne = (raw: any): UploadStoredResponse | null => {
        if (!raw || typeof raw !== "object") return null;
        const { id, datetime, stored, processed, savedCount } = raw;
        if (!id || !datetime ) return null;

        return {
            id: String(id),
            datetime: String(datetime),
            stored: typeof stored === "boolean" ? stored : undefined,
            processed: typeof processed === "boolean" ? processed : undefined,
            savedCount: typeof savedCount === "number" ? savedCount : undefined,
        };
    };

    const normalizeMany = (raw: any): UploadStoredResponse[] => {
        if (Array.isArray(raw)) return raw.map(normalizeOne).filter(Boolean) as UploadStoredResponse[];
        const one = normalizeOne(raw);
        return one ? [one] : [];
    }

    const fileUpload = async (file: File): Promise<UploadStoredResponse[]> => {
        setError(null);
        setIsLoading(true);
        try {
            const raw = await uploadStatement(file);
            const normalized = normalizeMany(raw);
            setUploadResult(normalized);
            return normalized;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Upload failed';
            setError(msg);
            setUploadResult([]);
            throw new Error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const fileUploadMany = async (files: File[]): Promise<UploadStoredResponse[]> => {
        setError(null);
        setIsLoading(true);
        try {
            const raw = await uploadStatements(files);
            const normalized = normalizeMany(raw);
            setUploadResult(normalized);
            return normalized;
        } catch(e) {
            const msg = e instanceof Error ? e.message : "Upload failed.";
            setError(msg);
            setUploadResult([]);
            throw new Error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return { uploadResult, error, fileUpload, fileUploadMany, isLoading };
}
