// /app/api/upload/service.ts

export async function uploadStatement(file: File) {
    const results = await uploadStatements([file]);
    return results[0];
}

export async function uploadStatements(files: File[]) {
    const results = await Promise.all(
        files.map(async (f) => {
            const fd = new FormData();
            fd.append('statement', f, f.name);

            const result = await fetch('/api/upload', { method: 'POST', body: fd });

            if (!result.ok) {
                const text = await result.text().catch(() => '');
                throw new Error(text || `Upload failed (${result.status})`);
            }
            return result.json();
        })
    );
    return results;
}
