// web-ui/app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        console.log('Fetching transactions from backend');
        // Forward the request to the FastAPI backend
        const response = await fetch('http://localhost:8000/api/transactions', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', },
        });

        // Handle non-JSON responses or errors
        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch transactions from backend' },
                { status: response.status }
            );
        }

        // Get the response from the backend
        let data;
        try {
            data = await response.json();
        } catch (e) {
            return NextResponse.json(
                { error: 'Invalid response from backend' },
                { status: 500 }
            );
        }

        return NextResponse.json(data || [], { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    console.log('Transactions POST API called');
    try {
        const transactions = await request.json();
        console.log('Received transactions to save: ', transactions);

        const response = await fetch('http://localhost:8000/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(transactions),
        });
        console.log('Backend save status: ', response.status);
        const data = await response.json();
        console.log('Backend save response data: ', data);
        
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Error saving transactions: ', error);
        return NextResponse.json(
            { error: 'Failed to save transactions' },
            { status: 500 }
        );
    }
}