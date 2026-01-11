import { useState, useMemo, useCallback } from "react";

export type NotesById = Record<string | number, string>;

export function useEditableNotes(rows: Array<Record<string, unknown>>) {
    const initial = useMemo<NotesById>(() => ({}), [rows]);
    const [notesById, setNotesById] = useState<NotesById>(initial);

    const setNote = useCallback((id: string | number, value: string) => {
        setNotesById(prev => ({ ...prev, [id]: value }));
    }, []);

    const withNotes = useCallback(() => {
        return rows.map((row) => {
        const id = (row.id as string | number) ?? JSON.stringify(row); // fallback for previews
        return { ...row, notes: notesById[id] ?? "" };
        });
    }, [rows, notesById]);

    return { notesById, setNote, withNotes };
}
