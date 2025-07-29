// web-ui/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Get the form data from the request
        const formData = await request.formData();
        const file = formData.get('statement') as File;

        console.log('File received:', file ? { name: file.name, type: file.type, size: file.size } : 'No file');

        if (!file) {
            console.error('No file uploaded');
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Create a new FormData object to forward to the backend
        const backendFormData = new FormData();
        backendFormData.append('statement', file);
        console.log('Forwarding to backend:', `http://localhost:8000/api/upload/`);

        // Forward the request to the FastAPI backend
        const response = await fetch('http://localhost:8000/api/upload/', {
            method: 'POST',
            body: backendFormData,
        });

        console.log('Backend response status:', response.status);
        console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));

        // Handle non-JSON responses
        let data;
        try {
            data = await response.json();
            console.log('Backend response data:', data);
        } catch (e) {
            const text = await response.text();
            console.error('Failed to parse JSON response:', text);
            data = { message: text };
        }

        // Return the response from the backend
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const response = await fetch('http://localhost:8000/api/transactions', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        // Get response from backend
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        );
    }
}