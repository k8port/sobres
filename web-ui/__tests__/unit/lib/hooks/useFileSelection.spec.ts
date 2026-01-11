import { renderHook, act } from "@testing-library/react";
import { useFileSelection } from "@/app/lib/hooks/useFileSelection";
import { test, expect } from "vitest";

const createPdf = () => new File(["dummy"], "file.pdf", { type: "application/pdf" });

test('accepts valid PDF file', () => {
    const { result } = renderHook(() => useFileSelection());

    const file = createPdf();
    const event = { target: { files: [file] } } as any;

    act(() => {
        result.current.handleChange(event);
    });

    expect(result.current.file).toBe(file);
});

