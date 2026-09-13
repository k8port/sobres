'use client';
import { fetchSavedStatementRanges } from '@/app/api/uploads/service';
import { useAuth } from '@/app/lib/context/AuthContext';
import { computeDateCoverage } from '@/app/lib/dateCoverage';
import { useEditableNotes } from '@/app/lib/hooks/useEditableNotes';
import { useOnboardingFlag } from '@/app/lib/hooks/useOnboardingFlag';
import { useSaveTransactions } from '@/app/lib/hooks/useSaveTransactions';
import { useUploadAndParse } from '@/app/lib/hooks/useUploadAndParse';
import type { StatementRange } from '@/app/lib/statementCoverage';
import { useEffect, useState } from 'react';
import { deleteTransaction, getTransactions } from './api/transactions/service';

import Logo from '@/app/ui/Logo';
import OnboardingPrompt from '@/app/ui/OnboardingPrompt';
import TransactionsTable from '@/app/ui/transactions/TransactionsTable';
import NavMenu from './ui/NavMenu';

const BUDGET_CATEGORIES = [
    'auto',
    'mortgage',
    'utility',
    'clothes',
    'sundry',
    'grocery',
    'car maint/repair',
    'home maint/repair',
    'fees',
    'entertainment',
] as const;

const CATEGORY_KEYWORDS: Array<{ category: (typeof BUDGET_CATEGORIES)[number]; terms: string[] }> =
    [
        { category: 'mortgage', terms: ['mortgage', 'home loan'] },
        {
            category: 'utility',
            terms: [
                'electric',
                'water',
                'gas bill',
                'internet',
                'xfinity',
                'comcast',
                'verizon',
                'utility',
            ],
        },
        {
            category: 'grocery',
            terms: [
                'grocery',
                'market',
                'supermarket',
                'aldi',
                'trader',
                'whole foods',
                'kroger',
                'costco',
            ],
        },
        { category: 'auto', terms: ['auto', 'insurance', 'dmv'] },
        { category: 'car maint/repair', terms: ['tire', 'oil', 'repair', 'mechanic', 'car wash'] },
        {
            category: 'home maint/repair',
            terms: ['home depot', 'lowes', 'plumb', 'hvac', 'appliance repair'],
        },
        { category: 'fees', terms: ['fee', 'service charge', 'overdraft', 'atm fee', 'late fee'] },
        {
            category: 'entertainment',
            terms: ['netflix', 'spotify', 'hulu', 'cinema', 'movie', 'concert'],
        },
        { category: 'clothes', terms: ['clothing', 'apparel', 'nike', 'gap', 'old navy'] },
        { category: 'sundry', terms: ['amazon', 'target', 'walmart', 'misc'] },
    ];

function normalizeCategory(raw: unknown): string {
    const candidate = String(raw ?? '')
        .trim()
        .toLowerCase();
    return BUDGET_CATEGORIES.includes(candidate as (typeof BUDGET_CATEGORIES)[number])
        ? candidate
        : '';
}

function inferCategory(row: Record<string, unknown>): string {
    const preset = normalizeCategory(row.category ?? row.budgetCategory);
    if (preset) return preset;

    const haystack =
        `${String(row.payee ?? '')} ${String(row.description ?? '')} ${String(row.cat ?? '')}`.toLowerCase();
    for (const rule of CATEGORY_KEYWORDS) {
        if (rule.terms.some(term => haystack.includes(term))) {
            return rule.category;
        }
    }
    return '';
}

function toNumericAmount(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

export default function Home() {
    const [files, setFiles] = useState<File[]>([]);
    const [uploadSuccess, setUploadSuccess] = useState<{
        statementCount: number;
        transactionCount: number;
    } | null>(null);
    const [autoPersisted, setAutoPersisted] = useState(false);

    const { user } = useAuth();
    const { isOnboarding, setOnboardingFlag } = useOnboardingFlag();
    const { run, isUploading, uploadError, uploadResult, parseStatus, parseError, rows } =
        useUploadAndParse();
    const { save, isSaving, saveError, saveSuccess } = useSaveTransactions(rows);
    const { notesById, setNote, withNotes } = useEditableNotes(rows);
    const [displayRows, setDisplayRows] = useState(rows);
    const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
    const [savedRanges, setSavedRanges] = useState<StatementRange[]>([]);

    useEffect(() => {
        setDisplayRows(
            rows.map((row: Record<string, unknown>) => ({
                ...row,
                budgetCategory: inferCategory(row),
            }))
        );
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
        setAutoPersisted(false);
        const rowsWithNotes = displayRows.map((row: Record<string, unknown>, index) => {
            const rowId = row.id as string | number | undefined;
            const note = rowId != null ? notesById[rowId] : undefined;
            const resolvedCategory = normalizeCategory(
                row.budgetCategory ?? row.category ?? row.cat
            );
            return {
                ...row,
                category: resolvedCategory || row.category || row.cat || 'uncategorized',
                notes: note ?? row.notes,
            };
        });
        await save(rowsWithNotes);
    };

    const handleCategoryChange = (index: number, category: string) => {
        setDisplayRows(prev =>
            prev.map((row: Record<string, unknown>, i) =>
                i === index
                    ? {
                          ...row,
                          budgetCategory: category,
                          category: category || 'uncategorized',
                      }
                    : row
            )
        );
    };

    const categoryTotals = BUDGET_CATEGORIES.reduce(
        (acc, category) => {
            acc[category] = 0;
            return acc;
        },
        {} as Record<string, number>
    );

    for (const row of displayRows as Array<Record<string, unknown>>) {
        const category = normalizeCategory(row.budgetCategory ?? row.category ?? row.cat);
        if (!category) continue;
        const amount = toNumericAmount(row.amount);
        if (amount < 0) {
            categoryTotals[category] += Math.abs(amount);
        }
    }

    const totalEnvelopeNeed = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);
    const requiredIncomeShare = monthlyIncome > 0 ? (totalEnvelopeNeed / monthlyIncome) * 100 : 0;
    const incomeMargin = monthlyIncome - totalEnvelopeNeed;

    const handleUpload = async () => {
        if (files.length === 0) {
            alert('Please upload a file first');
            return;
        }
        setUploadSuccess(null);
        setAutoPersisted(false);
        try {
            const result = await run(files);
            const parsedRows = result.rows.map((row: Record<string, unknown>) => ({
                ...row,
                budgetCategory: inferCategory(row),
            }));

            if (parsedRows.length > 0) {
                setDisplayRows(parsedRows);
            } else if (result.savedCount > 0) {
                // Fallback: if parse rows were not returned in-memory, read persisted rows.
                const persisted = await getTransactions('all');
                setDisplayRows(
                    persisted.map((row: Record<string, unknown>) => ({
                        ...row,
                        budgetCategory: inferCategory(row),
                    }))
                );
            } else {
                setDisplayRows([]);
            }

            // Re-fetch saved ranges from backend now that uploads are persisted
            const ranges = await fetchSavedStatementRanges();
            setSavedRanges(ranges);
            // Show success notification after parsing completes
            setUploadSuccess({
                statementCount: files.length,
                transactionCount: result.totalTransactions,
            });
            setAutoPersisted(
                result.totalTransactions > 0 && result.savedCount >= result.totalTransactions
            );
        } catch (e) {
            // Error will be shown in uploadError state
            setUploadSuccess(null);
            setAutoPersisted(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        setFiles(selected);
        setUploadSuccess(null);
        setAutoPersisted(false);
    };

    const coverage = computeDateCoverage([], savedRanges);

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

            <NavMenu enabled />
            {user && !coverage.complete && isOnboarding && (
                <OnboardingPrompt statementRanges={savedRanges} />
            )}

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
            {uploadSuccess && displayRows.length > 0 && (
                <div className="mt-4 w-full max-w-md bg-pomelowhite text-marengo p-4 rounded border border-menthol">
                    <p className="font-semibold">Upload Successful</p>
                    <p className="text-sm mt-2">
                        ✓ {uploadSuccess.statementCount} statement
                        {uploadSuccess.statementCount !== 1 ? 's' : ''} uploaded
                    </p>
                    <p className="text-sm">
                        ✓ {displayRows.length} transaction{displayRows.length !== 1 ? 's' : ''}{' '}
                        ready to review
                    </p>
                </div>
            )}

            {displayRows.length > 0 && (
                <>
                    <div className="mt-4 w-full max-w-4xl flex justify-end">
                        <div>
                            <button
                                type="button"
                                role="button"
                                onClick={handleSave}
                                disabled={isSaving || autoPersisted}
                                className="bg-robineggblue text-rosewhite py-2 px-4 rounded cursor-pointer hover:bg-pacificblue disabled:opacity-50 disabled:cursor-none"
                            >
                                {isSaving
                                    ? 'Updating...'
                                    : autoPersisted
                                      ? 'Already Saved'
                                      : 'Update Transactions'}
                            </button>
                            {saveSuccess && (
                                <p className="mt-2 text-sm text-screamingreen">{saveSuccess}</p>
                            )}
                            {autoPersisted && (
                                <p className="mt-2 text-sm text-screamingreen">
                                    Transactions were saved automatically during upload.
                                </p>
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
                        rows={displayRows}
                        notesById={notesById}
                        isSaving={isSaving}
                        onNotesChange={setNote}
                        onDeleteTransaction={onDeleteTransaction}
                        budgetCategories={[...BUDGET_CATEGORIES]}
                        getBudgetCategory={row =>
                            normalizeCategory(row.budgetCategory ?? row.category ?? row.cat)
                        }
                        onBudgetCategoryChange={handleCategoryChange}
                        showUploadIdColumn={true}
                        showCompositeKeyColumn={true}
                    />

                    <div className="mt-6 w-full max-w-4xl bg-white shadow rounded p-4">
                        <h3 className="text-lg font-semibold">Envelope Funding Snapshot</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Use this to estimate how much income should fund each spending envelope.
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                            <label
                                htmlFor="monthly-income"
                                className="text-sm font-medium text-gray-700"
                            >
                                Monthly net income
                            </label>
                            <input
                                id="monthly-income"
                                type="number"
                                min="0"
                                step="0.01"
                                value={monthlyIncome || ''}
                                onChange={e => setMonthlyIncome(Number(e.target.value || 0))}
                                className="border rounded p-1 text-sm w-48"
                            />
                        </div>

                        <div className="mt-4 overflow-auto">
                            <table className="min-w-full text-sm text-left text-porpoise divide-y divide-cadetgray">
                                <thead className="bg-cadetgray">
                                    <tr>
                                        <th className="px-3 py-2">Category</th>
                                        <th className="px-3 py-2">Needed Amount</th>
                                        <th className="px-3 py-2">Income Share</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-greekvilla divide-y divide-cadetgray">
                                    {BUDGET_CATEGORIES.map(category => {
                                        const needed = categoryTotals[category];
                                        const share =
                                            monthlyIncome > 0 ? (needed / monthlyIncome) * 100 : 0;
                                        return (
                                            <tr key={category}>
                                                <td className="px-3 py-2">{category}</td>
                                                <td className="px-3 py-2">${needed.toFixed(2)}</td>
                                                <td className="px-3 py-2">{share.toFixed(1)}%</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 grid gap-1 text-sm">
                            <p>
                                Total envelope need:{' '}
                                <strong>${totalEnvelopeNeed.toFixed(2)}</strong>
                            </p>
                            <p>
                                Income required: <strong>{requiredIncomeShare.toFixed(1)}%</strong>
                            </p>
                            <p>
                                Income margin: <strong>${incomeMargin.toFixed(2)}</strong>
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
