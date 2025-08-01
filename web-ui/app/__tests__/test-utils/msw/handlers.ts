// msw handlers for REST mocks
import { http, HttpResponse } from 'msw';

export const handlers = [
    http.post('http://localhost:8000/api/upload/', async () =>
        HttpResponse.json({
            rows: [{ id: 1, amount: 123 }],
            text: 'OK'
        })
    ),
    
    http.post('http://localhost:8000/api/transactions', async () =>
        HttpResponse.json({ saved: true })
    ),

    http.get('http://localhost:8000/api/transactions', async () =>
        HttpResponse.json({ rows: [{ id: 1, amount: 123 }]})
    ),
]