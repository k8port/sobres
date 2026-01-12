// web-ui/app/lib/hooks/useUploadAndParse.ts
import { useUploadStatement, } from '@/app/lib/hooks/useUploadStatement';
import { useParseStatement } from '@/app/lib/hooks/useParseStatement';

export function useUploadAndParse() {
    const upload = useUploadStatement();
    const parseHook = useParseStatement();

    const run = async (file: File) => {
        const up = await upload.fileUpload(file);
        if (up?.id) {
            await parseHook.parse(up.id);
        }
        return { upload: up, rows: parseHook.rows };
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
