'use client';

import { useEffect, useState } from 'react';
import { getTransactions } from '@/app/api/transactions/service';
import NavMenu from '@/app/ui/NavMenu';

export default function TransactionsPage() {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        getTransactions('all').then(rows => setCount(rows.length));
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-b from-crayolablue to-aquamarine">
            <NavMenu enabled />
            <p className="text-4xl font-bold text-white mt-12">
                {count === null
                    ? 'Loading transactions…'
                    : `User has ${count} transactions to display here`}
            </p>
        </div>
    );
}
