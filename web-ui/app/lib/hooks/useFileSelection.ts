import { useState } from "react";

export function useFileSelection() {
    const [file, setFile] = useState<File | null>(null);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.files?.[0];
        if (selected && selected.type === 'application/pdf') {
            setFile(selected);
        } else {
            event.target.value = '';
        }
    };

    return { file, handleChange };
}