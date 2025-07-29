"use client";

import { useState } from "react";

export interface Transaction {
  id?: number;
  date: string;
  description: string;
  amount: number;
  payee?: string;
  category?: string;
  subcategory?: string;
  notes?: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    if (!rows || rows.length === 0) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const toSave = rows!;
      const count = toSave.length;

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      });

      const saved = await response.json();
      if (!response.ok) {
        throw new Error(saved.error || saved.detail || "Failed to save transactions");
      }
      setSaveSuccess(`Saved ${count} transactions to database`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setRows(null);
      setText(null);
      setError(null);
    } else {
      alert("Please upload a valid PDF file");
      event.target.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      alert("Please upload a file first");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("statement", file);

      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || "Failed to upload file");
      }

      const data = await response.json();
      setRows(data.rows || []);
      setText(data.text || "");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setRows(null);
      setText(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-10">
      <h1 className="text-2xl font-bold mb-6">Budget Statement Upload</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 shadow-md rounded space-y-4 w-full max-w-md">
        <label htmlFor="file" className="block text-sm font-medium text-gray-700">Upload PDF Statement</label>
        <input
          type="file"
          accept="application/pdf, .pdf"
          onChange={handleChange}
          id="file"
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded cursor-pointer p-2"
        />
        {file && <p className="text-sm text-gray-500">Selected: {file.name}</p>}
        <button
          type="submit"
          className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded cursor-pointer hover:bg-blue-700 disabled:opacity-50 disabled:cursor-none"
          disabled={!file || isLoading}
        >
          {isLoading ? "Uploading..." : "Upload Statement"}
        </button>
      </form>

      {error && (
        <div className="mt-6 w-full max-w-md bg-red-50 text-red-700 p-4 rounded border border-red-200">
          <p>{error}</p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="mt-10 w-full max-w-4xl bg-white shadow rounded p-4 overflow-auto">
          <h2 className="text-lg font-semibold mb-2">Transactions</h2>
          <table className="min-w-full text-sm text-left text-gray-700 divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                {Object.keys(rows[0]).map((key) => (
                  <th key={key} className="px-4 py-2 text-xs border-b">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row, i) => (
                <tr key={i} className="even:bg-gray-50">
                  {Object.values(row).map((value, j) => (
                    <td key={j} className="px-4 py-2 whitespace-nowrap border-b">
                      {typeof value === 'number' ? value.toLocaleString() : String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4">
            <button
              type="button"
              role="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 text-white py-2 px-4 rounded cursor-pointer hover:bg-blue-700 isSaving:bg-black disabled:opacity-50 disabled:cursor-none"
            >
              {isSaving ? "Saving..." : "Save Transactions"}
            </button>
            {saveSuccess && (
              <p className="mt-2 text-sm text-green-600">{saveSuccess}</p>
            )}
            {saveError && (
              <p className="mt-2 text-sm text-red-600">{saveError}</p>
            )}
          </div>
        </div>
      )}

      {rows && rows.length === 0 && (
        <div className="mt-6 w-full max-w-md bg-yellow-50 text-yellow-700 p-4 rounded border border-yellow-200">
          <p>No tables found in the uploaded statement.</p>
        </div>
      )}
      
      <div className="mt-6">
        <p className="text-sm text-gray-500">Upload another PDF to extract data.</p>
      </div>
    </div>
  );
}