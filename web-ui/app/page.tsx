"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [text, setText] = useState<string | null>(null);


  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setRows(null);
      setText(null);
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

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    const contentType = response.headers.get("content-type");
    let body;
    if (contentType?.includes("application/json")) {
      body = await response.json();
    } else {
      body = { error: await response.text()};
    }

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${body?.error || 'unknown error'}`);
    }

    setRows(body.rows);
    setText(body.text);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-10">
      <form onSubmit={handleSubmit} className="bg-white p-8 shadow-md rounded space-y-4">
        <label htmlFor="file" className="block text-sm font-medium text-gray-700">Upload PDF File</label>
        <input
          type="file"
          accept="application/pdf, .pdf"
          onChange={handleChange}
          id="file"
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded cursor-pointer"
        />
        {file && <p className="text-sm text-gray-500">Selected: {file.name}</p>}
        <button
          type="submit"
          className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          disabled={!file}
        >
          Upload
        </button>
      </form>

      {text && (
        <div className="mt-10 w-full max-w-4xl bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Extracted Statement Text</h2>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">{text}</pre>
        </div>
      )}

      {rows && rows.length > 0 &&(
        <div className="mt-10 w-full max-w-4xl bg-white shadow rounded p-4 overflow-auto">
          <h2 className="text-lg font-semibold mb-2">Extracted Tables</h2>
          <table className="min-w-full text-sm text-left text-gray-700 divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                {Object.keys(rows[0] || {}).map((key) => (
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
                      {typeof value === "number"
                        ? value.toLocaleString()
                        : String(value)
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}