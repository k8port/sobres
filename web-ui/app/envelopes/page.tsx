"use client";
import useSWR from "swr";
import fetcher from "../lib/fetcher";

interface Category {
    id: number;
    name: string;
    percentage: number;
    balance: number;
}

/**
 * Next.js Dashboard UI at `/envelopes` (/web-ui/app/ui/envelopes/page.tsx)
 */

export default function EnvelopesPage() {
    const { data } = useSWR('/api/envelopes', fetcher);
    
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Envelope Balances</h1>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.categories?.map((cat: Category) => (
                <div key={cat.id} className="p-4 bg-white rounded shadow">
                <h2 className="font-semibold">{cat.name}</h2>
                <p>Allocation: {cat.percentage}%</p>
                <p>Balance: ${cat.balance.toFixed(2)}</p>
                </div>
            ))}
            </div>
        </div>
    );
}
