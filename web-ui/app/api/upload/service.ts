// /app/api/upload/service.ts

export async function uploadStatement(file: File) {
    const fd = new FormData();
    fd.append("statement", file);

    const response = await fetch("/api/upload", {
        method: "POST",
        body: fd
    });

    const contentType = response.headers.get("content-type");

    const body = contentType?.includes("application/json")
        ? await response.json().catch(() => null)
        : await response.text();
    
    if (!response.ok) {
        const message =
            typeof body === "string"
                ? body
                : body?.detail || body?.error || "Failed to upload file";
        throw new Error(message);
    }

    if (!body || typeof body !== "object") {
        throw new Error("Malformed upload response");
    }

    return body as { id: string; datetime: string };
}
