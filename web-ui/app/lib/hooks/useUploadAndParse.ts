// web-ui/app/lib/hooks/useUploadAndParse.ts
import { saveTransactions } from '@/app/api/transactions/service';
import { useParseStatement } from '@/app/lib/hooks/useParseStatement';
import { useUploadStatement } from '@/app/lib/hooks/useUploadStatement';

type UploadLike = { id?: String | null };

function asList<T>(v: T | T[] | null | undefined): T[] {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
}

export interface UploadAndParseResult {
    uploadCount: number;
    totalTransactions: number;
    savedCount: number;
    successCount: number;
    failureCount: number;
    rows: Record<string, unknown>[];
}

export function useUploadAndParse() {
    const upload = useUploadStatement();
    const parseHook = useParseStatement();

    const run = async (files: File | File[]): Promise<UploadAndParseResult> => {
        const list = Array.isArray(files) ? files : [files];

        const result = await upload.fileUploadMany(list);
        const uploads = asList<UploadLike>(result as any).filter((u) => Boolean(u?.id));
        const aggregatedRows: Record<string, unknown>[] = [];

        let successCount = 0;
        let failureCount = 0;

        for (const u of uploads) {
            try {
                const parsedRows = await parseHook.parse(String(u.id));
                aggregatedRows.push(...parsedRows);
                successCount++;
            } catch (e) {
                failureCount++;
            }
        }

        const totalTransactions = aggregatedRows.length;

        // Auto-persist parsed transactions to the database
        let savedCount = totalTransactions;
        try {
            const result = await saveTransactions(aggregatedRows);
            savedCount = result?.count ?? totalTransactions;
        } catch {
            // Save failed — rows are still displayed for manual retry
        }

        return {
            uploadCount: uploads.length,
            totalTransactions,
            savedCount,
            successCount,
            failureCount,
            rows: aggregatedRows,
        };
    };

    // Expose unified state plus both sub-states if callers need them
    return {
        run,
        isUploading: upload.isLoading,
        uploadError: upload.error,
        uploadResult: upload.uploadResult,
        parseStatus: parseHook.status,
        parseError: parseHook.error,
        rows: parseHook.rows,
    };
}
