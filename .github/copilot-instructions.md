# Copilot / AI Agent Instructions — SOBRES

## Quick Summary

SOBRES is a personal budget envelope-based expense tracking app. **Backend**: FastAPI + SQLAlchemy/SQLite (transaction/envelope CRUD, PDF statement parsing). **Frontend**: Next.js 15 (App Router) + React hooks + TailwindCSS. Frontend proxies requests via `BACKEND_URL` env var (defaults `http://localhost:8000`).

## How to Run (Dev)

- **Frontend**: `cd web-ui && pnpm install && pnpm run dev` (turbopack, port 3000). Env: `BACKEND_URL=http://localhost:8000`
- **Backend**: `source ~/venvs/sobres/bin/activate && cd py_backend && python main.py` (FastAPI/Uvicorn, port 8000)
- **Docker**: `docker-compose up --build` — sets internal BACKEND_URL: `http://py_backend:8000`
- **Make targets**: `make run-frontend`, `make run-backend-local`, `make up`, `make test`

## Development Approach

**AI's Role**: I function as your pair programmer, actively collaborating on code design, implementation, and problem-solving in real-time.

**Methodology**: SOBRES development follows **Agile Extreme Programming (XP)** practices:

- **Test-Driven Development (TDD)**: Write tests before implementation (MSW handlers first for frontend, conftest patterns for backend)
- **Continuous Integration**: Small, frequent commits with working code
- **Pair Programming**: Collaborative coding with immediate feedback loops
- **Refactoring**: Improve code quality iteratively without changing behavior
- **Simple Design**: Prefer clarity and maintainability over complex patterns
- **Code Review**: AI reviews proposals before implementation; user provides feedback
- **Collective Code Ownership**: Code is organized for team understanding and modification

## Testing

- **Backend**: `cd py_backend && PYTHONPATH=. pytest -q` (in-memory SQLite via conftest; `get_db` dependency overridden)
- **Frontend**:
  - Unit/integration: `cd web-ui && pnpm run test` (vitest + @testing-library/react)
  - E2E: `cd web-ui && pnpm run test:e2e` (Playwright)
  - **Key**: Tests use MSW (Mock Service Worker) handlers at `web-ui/__tests__/test-utils/msw/handlers.ts` — backend NOT required to run frontend tests

## Code Style & Patterns

### Backend (FastAPI + SQLAlchemy)

- **Dependency injection**: `Depends(get_db)` passes session to handlers (overridable in tests)
- **Async-first**: Router functions are async-capable; use `async def` for handlers
- **Error responses**: `HTTPException(status_code, detail=string)` propagates to client
- **Pydantic schemas**: Use `ConfigDict(from_attributes=True)` for ORM serialization
- **Schema pattern**: `Base`, `Create`, `Update`, `Response` for each model

### Frontend (Next.js + React Hooks)

- **Client components**: Mark interactive components with `'use client'` directive
- **Custom hooks**: Encapsulate API calls & state; return `{ data, error, isLoading, run/save }` pattern
- **Example hooks**: `useUploadAndParse()`, `useSaveTransactions()`, `useEditableNotes()` (see `web-ui/app/lib/hooks/`)
- **Types**: Keep TypeScript interfaces in `web-ui/app/lib/types.ts` (Transaction, SpendingCategory, etc.)
- **Styling**: TailwindCSS 4 (postcss-based); custom fonts defined in `app/layout.tsx` (lobster, opensans, slackey, inter)

## Architecture

- **Data flow**: Browser → Next.js API proxy routes (`/api/*`) → FastAPI backend → SQLite
- **Database schema**: Transaction (date, amount, payee, category_id FK) → Category → Envelope; Bill separate
- **Upload flow**: POST `/api/upload` (store PDF in-memory map) → POST `/api/upload/parse` (extract rows via pdfplumber) → frontend displays for user review → POST `/api/transactions` (bulk save)
- **Extraction pipeline**: `statement_extractor.py` (pdfplumber) → `transaction_parser.py` (regex parsing) → normalized TransactionCreate objects

## API Contract & Gotchas

### Upload Endpoints

- **POST `/api/upload`**: Accepts form key `file` OR `statement`. Frontend tries both with/without trailing slash for resilience.
- **POST `/api/upload/parse`**: Requires `uploadId` (query param or JSON) → returns `{ rows: [...], extracted_text: "..." }`

### Transaction Endpoints

- **GET `/api/transactions`**: Returns all, ordered by date DESC
- **POST `/api/transactions`**: Bulk insert List[TransactionCreate]; returns `{ count: number }`
- **PATCH `/api/transactions/:id`**: Envelope assignment; only allows `envelopeId` for payment transactions (returns 409 for deposits)
- **DELETE `/api/transactions/:id`**: Returns 204 No Content

### Test Infrastructure

- Backend conftest replaces `get_db` dependency + patches `session_mod.engine`/`SessionLocal` globals
- Frontend MSW handlers control state via handler-scope arrays (mutable, preserved across test runs)
- MSW enforces API contracts: 400 missing uploadId, 409 invalid envelope assignment, 204 for deletes

## Key Files Reference

| Category              | File                                                                  | Purpose                                                                 |
| --------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Backend Core**      | `py_backend/app/main.py`, `py_backend/app/api/*.py`                   | FastAPI routers (upload, transactions, envelopes, categories, bills)    |
| **Backend DB**        | `py_backend/app/db/models.py`, `schemas.py`, `session.py`             | SQLAlchemy models, Pydantic schemas, engine setup                       |
| **Backend Logic**     | `py_backend/app/core/statement_extractor.py`, `transaction_parser.py` | PDF extraction, regex parsing, data normalization                       |
| **Frontend Pages**    | `web-ui/app/page.tsx`, `transactions/`, `payments/`, `envelopes/`     | Main upload, transaction list, payment/deposit tracking, envelope views |
| **Frontend Services** | `web-ui/app/api/*/service.ts`, `app/api/*/route.ts`                   | Service functions + Next.js API proxy routes                            |
| **Frontend Hooks**    | `web-ui/app/lib/hooks/`                                               | `useUploadAndParse`, `useSaveTransactions`, `useEditableNotes`, etc.    |
| **Frontend Types**    | `web-ui/app/lib/types.ts`                                             | TypeScript interfaces (Transaction, SpendingCategory, Category)         |
| **Frontend UI**       | `web-ui/app/ui/`, components (Logo, NavMenu, TransactionsTable)       | Reusable UI components                                                  |
| **Test Mocks**        | `web-ui/__tests__/test-utils/msw/handlers.ts`                         | MSW handler mocks for all API endpoints                                 |
| **Test Setup**        | `py_backend/tests/conftest.py`, `web-ui/vitest.setup.ts`              | In-memory DB, dependency overrides, MSW setup                           |

## Where to Add Features

### Backend: New API Endpoint

1. Add model to `py_backend/app/db/models.py` (SQLAlchemy ORM class)
2. Add Pydantic schemas to `py_backend/app/db/schemas.py` (Create, Response classes with `from_attributes=True`)
3. Create router in `py_backend/app/api/new_feature.py` with `@router.post()`, `@router.get()`, etc.
4. Include router in `py_backend/app/main.py`: `app.include_router(new_router, tags=["feature"])`
5. Add tests in `py_backend/tests/unit/` or `integration/` using conftest fixtures (in-memory DB, client)
6. Database auto-creates on startup (no migrations yet)

### Frontend: New Page/Feature

1. **Update MSW handlers first** in `web-ui/__tests__/test-utils/msw/handlers.ts` (TDD approach)
2. Add service functions in `web-ui/app/api/feature/service.ts` (e.g., `fetchFeature()`, `saveFeature()`)
3. Create API proxy route in `web-ui/app/api/feature/route.ts` (forwards to BACKEND_URL)
4. Build custom hook in `web-ui/app/lib/hooks/useFeature.ts` (encapsulates API + state)
5. Add page/component in `web-ui/app/feature/page.tsx` or `app/ui/FeatureComponent.tsx`
6. Add TypeScript interfaces to `web-ui/app/lib/types.ts`
7. Write unit/integration tests using MSW mocks (real backend not needed)

## AI Agent Checklist

- [ ] Read `py_backend/app/api/transactions.py` & `web-ui/__tests__/test-utils/msw/handlers.ts` to understand API contracts
- [ ] For DB changes: update `py_backend/tests/conftest.py` if schema changes (verify in-memory engine setup)
- [ ] Frontend tests: update MSW handlers BEFORE writing UI code (TDD pattern)
- [ ] Match HTTP status codes: 201 POST, 204 DELETE, 400 bad input, 409 constraint violation
- [ ] Backend error responses: `HTTPException(status_code, detail="error message")`
- [ ] Frontend error handling: check `error?.message` from caught exceptions
- [ ] Verify BACKEND_URL proxying in Next.js routes (`web-ui/app/api/*/route.ts`)
- [ ] Use `PYTHONPATH=. ` prefix when running backend tests locally
- [ ] Env vars: `BACKEND_URL` (backend host), `NEXT_PUBLIC_API_URL` (same), both default to `http://localhost:8000`
