'use client';
import { deleteTransaction } from './api/transactions/service';
import { useEffect, useState } from 'react';
import { useSaveTransactions } from '@/app/lib/hooks/useSaveTransactions';
import { useOnboardingFlag } from '@/app/lib/hooks/useOnboardingFlag';
import { computeDateCoverage } from '@/app/lib/dateCoverage';
import { useUploadAndParse } from '@/app/lib/hooks/useUploadAndParse';
import { useEditableNotes } from '@/app/lib/hooks/useEditableNotes';
import { setCachedRows } from '@/app/lib/transactionsCache';

import Logo from '@/app/ui/Logo';
import OnboardingPrompt from '@/app/ui/OnboardingPrompt';
import TransactionsTable from '@/app/ui/transactions/TransactionsTable';
import NavMenu from './ui/NavMenu';

export default function Home() {
    const [files, setFiles] = useState<File[]>([]);
    const [uploadSuccess, setUploadSuccess] = useState<{
        statementCount: number;
        transactionCount: number;
    } | null>(null);

    const { isOnboarding, setOnboardingFlag } = useOnboardingFlag();
    const { run, isUploading, uploadError, uploadResult, parseStatus, parseError, rows } =
        useUploadAndParse();
    const { save, isSaving, saveError, saveSuccess } = useSaveTransactions(rows);
    const { notesById, setNote, withNotes } = useEditableNotes(rows);
    const [displayRows, setDisplayRows] = useState(rows);

    useEffect(() => {
        setDisplayRows(rows);
    }, [rows]);

    const onDeleteTransaction = async (id: string | number) => {
        const strId = String(id);
        const prev = displayRows;

        setDisplayRows(rs => rs.filter((r: any) => String(r.id) !== strId));
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
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            alert('Please upload a file first');
            return;
        }
        setUploadSuccess(null);
        try {
            await run(files);
            setOnboardingFlag(true);
            // Show success notification after parsing completes
            setUploadSuccess({
                statementCount: files.length,
                transactionCount: rows.length,
            });
        } catch (e) {
            // Error will be shown in uploadError state
            setUploadSuccess(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        setFiles(selected);
        setUploadSuccess(null);
    };

    const transactionDates = rows.map((r: any) => r.date as string);
    const coverage = computeDateCoverage(transactionDates);
    const navEnabled = coverage.complete;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-b from-crayolablue to-aquamarine">
            <h1 className="text-6xl font-lobster font-bold text-ice stroke-white mb-16 pt-10">
                Above Money, Beyond Survival
            </h1>
            <Logo />
            <h2 className="text-2xl font-slackey font-bold text-yellowjasmine mb-6 pt-10">
                Bank Statement Upload
            </h2>

            {navEnabled && <NavMenu enabled={navEnabled} />}
            {isOnboarding && <OnboardingPrompt dates={transactionDates} />}

            <form className="bg-white mt-6 p-8 shadow-md rounded space-y-4 w-full max-w-md">
                <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                    Upload Account Statement
                </label>
                <input
                    type="file"
                    accept="application/pdf, .pdf"
                    multiple
                    onChange={handleFileChange}
                    id="file"
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded cursor-pointer p-2"
                />

                {files.length > 0 && (
                    <p className="text-sm text-gray-500">
                        Selected: {files.map(f => f.name).join(', ')}
                    </p>
                )}

                <button
                    type="button"
                    onClick={handleUpload}
                    className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded cursor-pointer hover:bg-blue-700 disabled:opacity-50 disabled:cursor-none"
                    disabled={parseStatus === 'parsing' || isUploading || files.length === 0}
                >
                    {isUploading
                        ? 'Uploading...'
                        : parseStatus === 'parsing'
                          ? 'Parsing...'
                          : 'Upload Account Statement'}
                </button>

                {uploadError && (
                    <div className="mt-6 w-full max-w-md bg-red-50 text-red-700 p-4 rounded border border-red-200">
                        <p className="font-semibold">Upload Error</p>
                        <p className="text-sm">{uploadError}</p>
                    </div>
                )}

                {parseError && (
                    <div className="mt-6 w-full max-w-md bg-red-50 text-red-700 p-4 rounded border border-red-200">
                        <p className="font-semibold">Parse Error</p>
                        <p className="text-sm">{parseError}</p>
                    </div>
                )}
            </form>

            {/* Success notification showing statements uploaded and transactions parsed */}
            {uploadSuccess && rows && rows.length > 0 && (
                <div className="mt-4 w-full max-w-md bg-green-50 text-green-700 p-4 rounded border border-green-200">
                    <p className="font-semibold">Upload Successful</p>
                    <p className="text-sm mt-2">
                        ✓ {uploadSuccess.statementCount} statement
                        {uploadSuccess.statementCount !== 1 ? 's' : ''} uploaded to storage
                    </p>
                    <p className="text-sm">
                        ✓ {rows.length} transaction{rows.length !== 1 ? 's' : ''} parsed, persisted
                        and ready
                    </p>
                </div>
            )}

            {rows && rows.length > 0 && (
                <>
                    <div className="mt-4 w-full max-w-4xl flex justify-end">
                        <div>
                            <button
                                type="button"
                                role="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-blue-600 text-white py-2 px-4 rounded cursor-pointer hover:bg-blue-700 disabled:opacity-50 disabled:cursor-none"
                            >
                                {isSaving ? 'Updating...' : 'Update Transactions'}
                            </button>
                            {saveSuccess && (
                                <p className="mt-2 text-sm text-green-600">{saveSuccess}</p>
                            )}
                            {saveError && (
                                <div className="mt-2 bg-red-50 text-red-700 p-3 rounded border border-red-200">
                                    <p className="text-sm font-semibold">Save Error</p>
                                    <p className="text-sm">{saveError}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <TransactionsTable
                        rows={rows}
                        notesById={notesById}
                        isSaving={isSaving}
                        onNotesChange={setNote}
                        onDeleteTransaction={onDeleteTransaction}
                        showUploadIdColumn={true}
                        showCompositeKeyColumn={true}
                    />
                </>
            )}
        </div>
    );
}
