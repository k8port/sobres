// /app/lib/hooks/useUploadStatement.ts

import { useState } from 'react';
import { uploadStatement } from '@/app/api/upload/service';

export type UploadResult = {
    id: string;
    datetime: string;
};
type UploadReturn = UploadResult | null;

export function useUploadStatement() {
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
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

            const { id, datetime } = raw as any;
            if (typeof id !== "string" || typeof datetime !== "string") {
                setUploadResult(null);
                return null;
            }

            const normalized: UploadResult = { id, datetime };
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

    return { uploadResult, error, fileUpload, isLoading };
}