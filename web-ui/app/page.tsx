'use client';
import { deleteTransaction } from "./api/transactions/service";
import { useEffect, useState } from "react";
import { useSaveTransactions } from "@/app/lib/hooks/useSaveTransactions";
import { useOnboardingFlag } from "@/app/lib/hooks/useOnboardingFlag";
import { useOnboardingProgress } from "@/app/lib/hooks/useOnboardingProgress";
import { useUploadAndParse } from "@/app/lib/hooks/useUploadAndParse";
import { useEditableNotes } from "@/app/lib/hooks/useEditableNotes";
import { setCachedRows } from "@/app/lib/transactionsCache";

import Logo from "@/app/ui/Logo";
import OnboardingPrompt from "@/app/ui/OnboardingPrompt";
import TransactionsTable from '@/app/ui/transactions/TransactionsTable';
import NavMenu from "./ui/NavMenu";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  
  const { isOnboarding, setOnboardingFlag } = useOnboardingFlag();
  const { uploadedMonths, percent, prevCalendarYear } = useOnboardingProgress({ primaryAccountId: 'acct-1' });
  const { run, isUploading, uploadError, uploadResult, parseStatus, parseError, rows } = useUploadAndParse();
  const { save, isSaving, saveError, saveSuccess } = useSaveTransactions(rows);
  const { notesById, setNote, withNotes } = useEditableNotes(rows);
  const [displayRows, setDisplayRows] = useState(rows);

  useEffect(() => {
    setDisplayRows;
  }, [rows]);
 
  const onDeleteTransaction = async (id: string | number) => {
    const strId = String(id);
    const prev = displayRows;

    setDisplayRows((rs) => rs.filter((r: any) => String(r.id) !== strId));

    try {
      await deleteTransaction(strId);
    } catch (e) {
      setDisplayRows(prev);
      throw e;
    } 
  };

  const handleSave = async () => {
    const rowsWithNotes = withNotes();
    await save(rowsWithNotes); // update useSaveTransactions to accept rowsWithNotes as optional override argument
  }

  const handleUpload = async () => {
    if (!file) {
      alert("Please upload a file first");
      return;
    }
    await run(file)
    setOnboardingFlag(true);
  }

  const handleParse = async () => {
    if (!uploadResult) {
      alert("Please upload a file first");
      return;
    }
    await run(file!);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
    }
  }

  const navEnabled = Boolean(uploadResult?.stored || (rows && rows.length > 0));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-b from-crayolablue to-aquamarine">

      <h1 className="text-6xl font-lobster font-bold text-ice stroke-white mb-16 pt-10">Above Money, Beyond Survival</h1>
      <Logo />
      <h2 className="text-2xl font-slackey font-bold text-yellowjasmine mb-6 pt-10">Bank Statement Upload</h2>

      {navEnabled && <NavMenu enabled={navEnabled} />}
      {isOnboarding && (
        <OnboardingPrompt
          uploadedMonths={uploadedMonths}
          prevCalendarYear={prevCalendarYear}
          percent={percent}
        />
      )} 

      
      <form className="bg-white mt-6 p-8 shadow-md rounded space-y-4 w-full max-w-md">
        <label htmlFor="file" className="block text-sm font-medium text-gray-700">Upload Account Statement</label>
        <input
          type="file"
          accept="application/pdf, .pdf"
          onChange={handleFileChange}
          id="file"
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded cursor-pointer p-2"
        />
        {file && <p className="text-sm text-gray-500">Selected: {file.name}</p>}
        
        <button
          type="button"
          onClick={handleUpload}
          className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded cursor-pointer hover:bg-blue-700 disabled:opacity-50 disabled:cursor-none"
          disabled={parseStatus === 'parsing' || !file}
        >
          {isUploading ? "Uploading..." : "Upload Account Statement"}
        </button>

        {uploadError && (
          <div className="mt-6 w-full max-w-md bg-red-50 text-red-700 p-4 rounded border border-red-200">
            <p>{uploadError}</p>
          </div>
        )}
      </form>

      {uploadResult?.stored && (
        <div className="mt-4 w-full max-w-md bg-green-50 text-green-700 p-3 rounded border-green-200">
          <p>Upload received and saved successfully</p>
        </div>
      )}

      {uploadResult?.processed && (
        <div className="mt-2 w-full max-w-md bg-green-50 text-green-700 p-3 rounded border-green-200">
          <p>Statement processed successfully and ({uploadResult.savedCount ?? rows?.length ?? 0 }) transactions saved to database.</p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
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
            <TransactionsTable
                rows={rows}
                notesById={notesById}
                isSaving={isSaving}
                onNotesChange={setNote}
                onDeleteTransaction={onDeleteTransaction}
            />
        </>
      )}

      {isOnboarding && uploadedMonths > 0 && (
        <div className="mt-6">
          <p className="text-sm text-white">Upload another PDF to extract data.</p>
        </div>
      )}
    </div>
  );
}