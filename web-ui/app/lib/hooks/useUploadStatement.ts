// /app/lib/hooks/useUploadStatement.ts

import { useState } from 'react';
import { uploadStatement, uploadStatements } from '@/app/api/upload/service';
import type { UploadStoredResponse } from '@/app/lib/types';

type UploadReturn = UploadStoredResponse | null;

export function useUploadStatement() {
    const [uploadResult, setUploadResult] = useState<UploadStoredResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fileUpload = async (file: File): Promise<UploadReturn> => {
        setError(null);
        setIsLoading(true);
        try {
            const raw = await uploadStatement(file);

            if (!raw || typeof raw !== "object") {
                setUploadResult(null);
                return null;
            }

            const { id, datetime, stored, processed, savedCount } = raw as any;
            if (typeof id !== "string" || typeof datetime !== "string") {
                setUploadResult(null);
                return null;
            }

            const normalized: UploadStoredResponse = {
                id,
                datetime,
                stored: typeof stored === 'boolean' ? stored : undefined,
                processed: typeof processed === 'boolean' ? processed : undefined,
                savedCount: typeof savedCount === 'number' ? savedCount : undefined,
            };

            setUploadResult(normalized);
            return normalized;

        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Upload failed';
            setError(msg);
            setUploadResult(null);
            throw new Error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const fileUploadMany = async (files: File[]): Promise<UploadReturn> => {
        setError(null);
        setIsLoading(true);
        try {
            const raw = await uploadStatements(files);

            if (!raw || typeof raw !== 'object') {
                setUploadResult(null);
                return null;
            }


            const { id, datetime, stored, processed, savedCount } = raw as any;
            if (typeof id !== "string" || typeof datetime !== "string") {
                setUploadResult(null);
                return null;
            }

            const normalized: UploadStoredResponse = {
                id,
                datetime,
                stored: typeof stored === 'boolean' ? stored : undefined,
                processed: typeof processed === 'boolean' ? processed : undefined,
                savedCount: typeof savedCount === 'number' ? savedCount : undefined,
            };

            setUploadResult(normalized);
            return normalized;
        } catch(e) {
            const msg = e instanceof Error ? e.message : "Upload failed.";
            setError(msg);
            setUploadResult(null);
            throw new Error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return { uploadResult, error, fileUpload, fileUploadMany, isLoading };
}