'use client';
import { deleteTransaction } from './api/transactions/service';
import { useEffect, useState } from 'react';
import { useSaveTransactions } from '@/app/lib/hooks/useSaveTransactions';
import { useOnboardingFlag } from '@/app/lib/hooks/useOnboardingFlag';
import { computeDateCoverage } from '@/app/lib/dateCoverage';
import { useUploadAndParse } from '@/app/lib/hooks/useUploadAndParse';
import { useEditableNotes } from '@/app/lib/hooks/useEditableNotes';
import { setCachedRows } from '@/app/lib/transactionsCache';
import { fetchSavedStatementRanges } from '@/app/api/uploads/service';
import type { StatementRange } from '@/app/lib/statementCoverage';

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
    const [savedRanges, setSavedRanges] = useState<StatementRange[]>([]);

    useEffect(() => {
        setDisplayRows(rows);
    }, [rows]);

    // Fetch saved statement ranges from backend on mount
    useEffect(() => {
        fetchSavedStatementRanges()
            .then(setSavedRanges)
            .catch(() => {});
    }, []);

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
            // Re-fetch saved ranges from backend now that uploads are persisted
            const ranges = await fetchSavedStatementRanges();
            setSavedRanges(ranges);
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

    const coverage = computeDateCoverage([], savedRanges);
    const navEnabled = coverage.complete;

    useEffect(() => {
        if (coverage.complete && isOnboarding) {
            setOnboardingFlag(false);
        }
    }, [coverage.complete, isOnboarding, setOnboardingFlag]);

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
            {isOnboarding && <OnboardingPrompt statementRanges={savedRanges} />}

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
                    className="block w-full text-sm text-gunmetal border border-templetongray rounded cursor-pointer p-2"
                />

                {files.length > 0 && (
                    <p className="text-sm text-fog">
                        Selected: {files.map(f => f.name).join(', ')}
                    </p>
                )}

                <button
                    type="button"
                    onClick={handleUpload}
                    className="mt-2 w-full bg-robineggblue text-pomelowhite font-bold py-2 px-4 rounded cursor-pointer hover:bg-pacificblue disabled:opacity-50 disabled:cursor-none"
                    disabled={parseStatus === 'parsing' || isUploading || files.length === 0}
                >
                    {isUploading
                        ? 'Uploading...'
                        : parseStatus === 'parsing'
                          ? 'Parsing...'
                          : 'Upload Account Statement'}
                </button>

                {uploadError && (
                    <div className="mt-6 w-full max-w-md bg-rosewhite text-angelsred p-4 rounded border border-lightcopperorange">
                        <p className="font-semibold">Upload Error</p>
                        <p className="text-sm">{uploadError}</p>
                    </div>
                )}

                {parseError && (
                    <div className="mt-6 w-full max-w-md bg-rosewhite text-angelsred p-4 rounded border border-lightcopperorange">
                        <p className="font-semibold">Parse Error</p>
                        <p className="text-sm">{parseError}</p>
                    </div>
                )}
            </form>

            {/* Success notification showing statements uploaded and transactions parsed */}
            {uploadSuccess && rows && rows.length > 0 && (
                <div className="mt-4 w-full max-w-md bg-pomelowhite text-marengo p-4 rounded border border-menthol">
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
                                className="bg-robineggblue text-rosewhite py-2 px-4 rounded cursor-pointer hover:bg-pacificblue disabled:opacity-50 disabled:cursor-none"
                            >
                                {isSaving ? 'Updating...' : 'Update Transactions'}
                            </button>
                            {saveSuccess && (
                                <p className="mt-2 text-sm text-screamingreen">{saveSuccess}</p>
                            )}
                            {saveError && (
                                <div className="mt-2 bg-rosewhite text-angelsred p-3 rounded border border-lightcopperorange">
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
