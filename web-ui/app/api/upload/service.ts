// /app/api/upload/service.ts

export async function uploadStatement(file: File) {
    return uploadStatements([file]);
}

export async function uploadStatements(files: File[]) {
    const fd = new FormData();
    for (const f of files) fd.append('statement', f, f.name);

    const result = await fetch('/api/upload', { method: 'POST', body: fd });

    if (!result.ok) {
        const text = await result.text().catch(() => '');
        throw new Error(text || `Upload failed (${result.status})`);
    }
    return result.json();
}
