# CLAUDE.md — Sobres Budgeting App

## Project Overview

Sobres is a personal envelope-based budgeting app. Users upload bank statements, view parsed transactions, assign spending categories (envelopes), and track expenses.

- **Frontend**: Next.js 15 (App Router) + React + TypeScript + TailwindCSS 4
- **Backend**: Python / FastAPI + SQLAlchemy + SQLite
- **Frontend proxies** to backend via `BACKEND_URL` env var (default `http://localhost:8000`)

## How to Run

- **Frontend**: `cd web-ui && pnpm install && pnpm run dev` (turbopack, port 3000)
- **Backend**: `source ~/venvs/sobres/bin/activate && cd py_backend && python main.py` (port 8000)
- **Docker**: `docker-compose up --build`
- **Make targets**: `make run-frontend`, `make run-backend-local`, `make up`, `make test`

## Development Methodology

Agile XP with strict Test-Driven Development. Red-green-refactor only. No feature code without a failing test first.

### TDD Rules (Non-Negotiable)

1. **Write the test first.** Always. No exceptions.
2. **Implement only what makes the test pass.** Nothing more.
3. **Do not refactor unless asked.** No unsolicited cleanup, no "while we're here" improvements.
4. **Do not jump ahead.** Stay on the current step. Don't anticipate future requirements.
5. **YAGNI.** If no test demands it, don't build it: no progress bars, no undo, no optimistic UI unless tests require it.
6. **Each step: Red -> minimal code -> Green -> stop.**

### AI Pair Programming Conduct

- **When tests fail 2-3 times on the same issue**: STOP going down the same path. Ask the user:
  - "What is the goal of this test?"
  - "What is the intended functionality?"
  - "How does this test drive our functionality?"
- **Never blame the programmer** for test failures caused by AI-generated code. Own mistakes.
- **Avoid "just one quick fix" spirals** that lead to exhaustion and lost perspective.
- **Keep focus on**: Does this test drive the functionality as intended? If not, the test itself may need rethinking.

### AI Pair Programming Key Points for Successful Communication

- **Be concise** — If the fix is one line, say one line. Don't pad with repeated context the user already knows.
- **Don't assume user deviation** — If the user followed instructions and it broke, the instructions were wrong. Own it.
- **Don't repeat irrelevant advice** — Read what the user actually shared before restating generic guidance. If the user showed you their directory structure, don't lecture about directory scoping that doesn't apply.

## Testing Stack

- **Frontend unit/integration**: Vitest + @testing-library/react + MSW (Mock Service Worker)
- **Frontend E2E**: Playwright
- **Backend**: `cd py_backend && PYTHONPATH=. pytest -q` (in-memory SQLite via conftest)
- **MSW handlers** at `web-ui/__tests__/test-utils/msw/handlers.ts` — backend NOT required for frontend tests
- MSW enforces API contracts: 400 missing uploadId, 409 invalid envelope assignment, 204 for deletes
- MSW handler state is mutable arrays (envelopes, transactions) reset via `___resetMswData()`

## Architecture

### Data Flow

Browser -> Next.js API proxy routes (`/api/*`) -> FastAPI backend -> SQLite

### Upload Flow

POST `/api/upload` (multipart, key `statement`, supports multiple files) -> backend stores + processes -> returns `{ stored, processed, transactionCount }` -> UI renders status messages:

1. "upload has been received and stored successfully"
2. "upload successfully processed and (x) transactions saved to db"

### Key Types

```typescript
// web-ui/app/lib/types.ts
interface Transaction { id?, date, description, amount, payee?, category?, subcategory?, notes? }
interface SpendingCategory { id: string, name: string, percentage?, balance? }

// web-ui/app/api/transactions/service.ts
type TransactionRow = { id, date, payee, amount, cat: string, envelopeId?: string | null, uploadId?: string }
```

### API Contract

| Endpoint | Method | Notes |
|---|---|---|
| `/api/upload` | POST | multipart, key `statement` (1-n files), returns `{ stored, processed, transactionCount }` |
| `/api/upload/parse` | POST | requires `uploadId` (query or JSON), returns `{ rows }` |
| `/api/transactions` | GET | `?cat=all\|payments\|deposits`, returns `TransactionRow[]` |
| `/api/transactions/:id` | PATCH | `{ envelopeId }`, payments only (409 for deposits) |
| `/api/transactions/:id` | DELETE | returns 204 |
| `/api/transactions` | POST | bulk insert, returns `{ count }` |
| `/api/envelopes` | GET | returns `{ categories: SpendingCategory[] }` |
| `/api/envelopes` | POST | `{ name, monthlyAmount? }`, returns created envelope (201) |

## Code Patterns

### Frontend

- **`'use client'`** directive needed on interactive components
- **Custom hooks**: encapsulate API + state; return `{ data, error, isLoading, run/save }` pattern
- **Hooks**: `useUploadAndParse()`, `useSaveTransactions()`, `useEditableNotes()`, `useFileSelection()` in `web-ui/app/lib/hooks/`
- **Service layer**: `web-ui/app/api/*/service.ts` — thin fetch wrappers tested against MSW
- **TransactionsTable**: pure display component, delegates via callbacks (`onEnvelopeChange`, `onNotesChange`)
- **PaymentsTable**: wrapper that fetches data and wires PATCH to TransactionsTable
- Envelope `<select>` uses `aria-label="Spending Category"` — tests query by this label
- **EnvelopesPage** uses SWR (`useSWR('/api/envelopes', fetcher)`) — expects `{ categories: SpendingCategory[] }` response shape
- **EnvelopeForm/EnvelopeList** are sub-components composed by EnvelopesPage
- **Envelopes unit tests** mock SWR directly (`vi.mock('swr')`) — no MSW at unit level; integration tests use MSW

### Backend (FastAPI + SQLAlchemy)

- Dependency injection via `Depends(get_db)` — all routes must use this for testability
- Pydantic schemas: `Base`, `Create`, `Update`, `Response` with `ConfigDict(from_attributes=True)`
- Error responses: `HTTPException(status_code, detail=string)`
- **Backend test structure**: `py_backend/tests/unit/` (pure logic, no DB) and `py_backend/tests/integration/` (API + DB via TestClient)
- **conftest.py pattern**: session-scoped in-memory SQLite engine, function-scoped `reset_db` (autouse), `get_db` dependency override so routes use test engine
- **Must `import app.db.models`** before `Base.metadata.create_all()` — otherwise tables aren't registered and you get "no such table"
- **Must override `app.dependency_overrides[get_db]`** in test client fixture — without this, routes use the production DB even if you patched `SessionLocal`

## Current Focus: Bulk Upload (1 -> n Statements)

### Acceptance Criteria (Fixed)

1. UI allows selecting one or many statement files in a single interaction
2. UI sends all files to backend in a single request (multipart form data, key `statement`)
3. UI shows success states: stored + processed messages with transaction count
4. `<input type="file" multiple name="statement" />`
5. `formData.append('statement', file)` for each file
6. Tests written first; implement only what makes them pass

### Implementation Order (Test-First)

1. **Contract test** — transactions include `uploadId` and `envelopeId` fields -> update types + MSW mocks
2. **Per-row Save** unit test -> table state only
3. **Envelope integration** -> page wiring with PATCH
4. **Bulk upload input** test -> form handling with `multiple` attribute
5. **Upload status messages** -> render stored/processed from response
6. **UploadId rendering** -> display upload source per transaction

### What NOT to Build Yet (YAGNI)

Until tests require them, do not implement:

- Grouping transactions by upload
- Bulk save across rows
- Undo
- Progress bars
- Re-fetch after PATCH
- Optimistic UI (unless a test demands it)

## Lessons Learned (From Prior Sessions)

### Common Pitfalls

#### Frontend Pitfalls

- **Wrong import in tests**: Importing `TransactionsTable` when meaning `PaymentsTable` (wrapper). The pure table requires props; the wrapper fetches its own data.
- **Passing `rows={[]}`** to TransactionsTable causes it to return `null` — no elements render.
- **URL typos** in service functions (e.g., `/api/envlopes`) caught by MSW's unhandled request errors.
- **Test querying wrong accessible name**: Component uses `aria-label="Spending Category"` — tests must match this exactly, not `/envelope/i`.
- **MSW handler body parsing**: Use tolerant parsing (try/catch around `request.json()`) to handle edge cases.
- **Misplaced contract tests**: API contract tests (service layer + MSW) should be in `integration/`, not `unit/`.
- **FormData/File realm mismatch in jsdom**: Vitest jsdom provides its own `FormData`/`File` classes, but Node/Undici `fetch` doesn't recognize them as multipart — the request becomes `text/plain` instead of `multipart/form-data`. Fix: override globals with undici types in `setup.integration.ts` (`import { Blob, File, FormData } from 'undici'` then assign to `globalThis`).
- **Never set Content-Type manually for FormData**: Let `fetch` auto-set it with the multipart boundary. Setting `headers: { 'Content-Type': 'multipart/form-data' }` breaks the boundary and causes parsing failures.
- **Missing callback props in unit tests**: Optional callback props like `onSaveRow?.(id)` silently do nothing if the prop isn't passed. Always pass a `vi.fn()` mock for any callback you intend to assert on.
- **`isSaving={true}` disables buttons**: Setting `isSaving` to `true` in a test disables Save buttons, so click handlers won't fire. Use `isSaving={false}` when testing click behavior.
- **Row ID type mismatch**: If fixture row IDs are numbers (`101`), expect numbers in assertions — not strings (`'101'`).

#### Backend

- **Pytest fixture decorator vs function args**: `@pytest.fixture(scope="function", autouse=True)` — scope and autouse go on the decorator, NOT as default function parameters. Writing `def reset_db(scope="function", autouse=True)` creates a fixture that expects two string args, not a scoped autouse fixture.
- **Tests hitting production DB**: Simply patching `SessionLocal` isn't enough. Must use `app.dependency_overrides[get_db]` to redirect all `Depends(get_db)` calls to the test engine. Without this, routes open sessions against the real DB.
- **"No such table" in tests**: Caused by calling `Base.metadata.create_all()` before models are imported. Always `import app.db.models` in conftest before `create_all`.
- **Data accumulating across test runs**: If `reset_db` isn't working or tests hit a file-based DB, rows pile up. Verify: (1) fixture decorator is correct, (2) dependency override is in place, (3) engine is truly in-memory (`sqlite:///:memory:`).
- **Fixture injection**: Fixtures are injected by parameter name — no manual imports needed. Use `autouse=True` for fixtures that every test in a directory needs.

### Test Architecture

- **Unit tests**: Test component behavior in isolation with props/mocks. No network. No MSW. No DB.
- **Integration tests**: Render wrapper components (page-level or data-fetching wrappers). MSW intercepts network (frontend). TestClient + in-memory DB (backend). No props needed.
- **Contract tests**: Call service functions directly against MSW. Verify request/response shapes.
- **Separation principle**: TransactionsTable (pure) vs PaymentsTable (fetches + patches) — test each at the right level.
- **Backend unit vs integration**: Unit tests cover `app/core/` functions (parsers, extractors) with no DB. Integration tests cover API routes via `TestClient` with in-memory SQLite.

## Key Files

| Category | Path | Purpose |
|---|---|---|
| Frontend Pages | `web-ui/app/page.tsx`, `transactions/`, `payments/`, `envelopes/` | Main views |
| Services | `web-ui/app/api/*/service.ts` | Thin fetch wrappers |
| API Routes | `web-ui/app/api/*/route.ts` | Next.js proxy to backend |
| Hooks | `web-ui/app/lib/hooks/` | State + API encapsulation |
| Types | `web-ui/app/lib/types.ts` | TypeScript interfaces |
| Components | `web-ui/app/ui/`, `app/components/` | Reusable UI |
| MSW Handlers | `web-ui/__tests__/test-utils/msw/handlers.ts` | Mock all API endpoints |
| MSW Server | `web-ui/__tests__/test-utils/msw/server.ts` | MSW setup |
| Test Setup | `web-ui/__tests__/setup.ts` | Vitest global setup |
| Backend Core | `py_backend/app/main.py`, `py_backend/app/api/*.py` | FastAPI routers |
| Backend DB | `py_backend/app/db/models.py`, `schemas.py`, `session.py` | SQLAlchemy + Pydantic |
| Backend Logic | `py_backend/app/core/statement_extractor.py`, `transaction_parser.py` | PDF parsing |
| Backend Tests | `py_backend/tests/conftest.py` | Shared fixtures (engine, reset_db, client) |

## Adding Features

### Frontend (TDD order)

1. Update MSW handlers first (`handlers.ts`)
2. Write failing test
3. Add service function in `app/api/feature/service.ts`
4. Add API proxy route in `app/api/feature/route.ts`
5. Build hook in `app/lib/hooks/useFeature.ts`
6. Add page/component
7. Make test green. Stop.

### Backend Key Points on Adding Features

1. Add model to `py_backend/app/db/models.py`
2. Add Pydantic schemas to `schemas.py`
3. Create router in `py_backend/app/api/`
4. Include router in `main.py`
5. Add tests using conftest fixtures
