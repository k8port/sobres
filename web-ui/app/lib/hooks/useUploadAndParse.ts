// web-ui/app/lib/hooks/useUploadAndParse.ts
import { useUploadStatement } from '@/app/lib/hooks/useUploadStatement';
import { useParseStatement } from '@/app/lib/hooks/useParseStatement';

type UploadLike = { id?: String | null };

function asList<T>(v: T | T[] | null | undefined): T[] {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
}

export function useUploadAndParse() {
    const upload = useUploadStatement();
    const parseHook = useParseStatement();

    const run = async (files: File | File[]) => {
        const list = Array.isArray(files) ? files : [files];
        
        const result = await upload.fileUploadMany(list);
        const uploads = asList<UploadLike>(result as any).filter((u) => Boolean(u?.id));

        for (const u of uploads) {
            await parseHook.parse(String(u.id));
        }
        return { upload: result, rows: parseHook.rows };
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
