# Copilot / AI Agent Instructions — SOBRES

Quick summary
- This repo contains a FastAPI Python backend (py_backend) and a Next.js (app router) frontend (web-ui). The frontend proxies API requests to the backend using BACKEND_URL (defaults to http://localhost:8000).

How to run (dev)
- Frontend (local):
  - cd web-ui && pnpm install && pnpm run dev  # uses turbopack
  - env: set BACKEND_URL to the backend host (defaults to http://localhost:8000)
- Backend (local):
  - Recommended venv workflow used in Makefile: source ~/venvs/sobres/bin/activate && cd py_backend && python main.py
  - Or: cd py_backend && python main.py (runs Uvicorn).
- Docker: docker-compose up --build (services: `web-ui`, `py_backend`). docker-compose sets BACKEND_URL: http://py_backend:8000 and NEXT_PUBLIC_API_URL for the UI.
- Make targets: `make run-frontend`, `make run-backend-local`, `make run-backend-docker`, `make up`.

Tests
- Backend: cd py_backend && PYTHONPATH=. pytest -q  (or `make test`). Tests use an in-memory SQLite engine via conftest.py and override `get_db` dependency.
- Frontend:
  - Unit/integration: cd web-ui && pnpm run test (vitest)
  - E2E: cd web-ui && pnpm run test:e2e (Playwright)
  - Note: frontend tests use MSW handlers in `web-ui/__tests__/test-utils/msw/handlers.ts` to mock backend responses — the real backend does not need to be running for those tests.

Architecture & conventions (important)
- Backend
  - Entry: `py_backend/main.py` (starts uvicorn -> `app.main:app`). App setup at `py_backend/app/main.py`.
  - DB: SQLAlchemy + SQLite. DB setup in `py_backend/app/db/session.py` — by default an on-disk `budget.db` is created in the project when running the backend. Tests replace the engine with an in-memory SQLite engine.
  - Models: `py_backend/app/db/models.py` (Transaction, Category, Envelope, Bill). Pydantic schemas live in `py_backend/app/db/schemas.py`.
  - API routers: `py_backend/app/api/*.py` (notably `upload.py`, `transactions.py`). New routers should be `include_router`d in `app.main`.
  - Uploads: current implementation stores files in a temporary in-memory map `_UPLOAD_STORE` (no persistence). Upload parsing uses extractors in `app/core/*`.
- Frontend
  - Next.js App Router (`web-ui/app`). Pages/components follow the app dir conventions.
  - API proxy routes in `web-ui/app/api/*` forward requests to BACKEND_URL. They use `runtime = 'nodejs'` and handle fallback behaviors (e.g., trailing slash inconsistencies when forwarding uploads).
  - Fetch helper: `web-ui/app/lib/fetcher.ts` — basic JSON fetch wrapper used by UI.
  - Tests: unit/integration tests rely on MSW handlers which reproduce the backend contracts (e.g., `/api/upload`, `/api/upload/parse`, `/api/transactions`).

API contract notes & gotchas (explicit)
- Upload endpoint accepts either form key `file` or `statement` (see `py_backend/app/api/upload.py` and `web-ui/app/api/upload/route.ts`). Frontend tries both endpoints with and without trailing slash.
- `/api/upload/parse` expects an `uploadId` (query or JSON body) and returns rows + extracted text.
- `/api/transactions`:
  - GET returns all transactions ordered by date desc.
  - POST accepts a bulk list of `TransactionCreate` objects and persists them.
  - PATCH `/api/transactions/:id` is used by the UI to set `envelopeId`. MSW enforces: envelopeId only allowed for payment transactions (returns 409 otherwise).
- Tests rely on `py_backend/tests/conftest.py` behavior: the conftest replaces `session_mod.engine` and `SessionLocal` and overrides FastAPI dependency `get_db`. When changing `session.py`, ensure tests still override properly.

Where to add features (practical)
- Backend: add an API module in `py_backend/app/api/` and include it in `py_backend/app/main.py`. Add database models to `py_backend/app/db/models.py` and Pydantic schema to `py_backend/app/db/schemas.py`. Add / update tests in `py_backend/tests/` and use conftest patterns (in-memory DB) to test behavior.
- Frontend: add UI pages under `web-ui/app/` and helper API proxies under `web-ui/app/api/` that forward to BACKEND_URL. Update MSW handlers under `web-ui/__tests__/test-utils/msw/handlers.ts` to reflect backend contract changes so tests remain fast and deterministic.

Useful files to inspect quickly
- `py_backend/app/main.py`, `py_backend/app/api/upload.py`, `py_backend/app/api/transactions.py`
- `py_backend/app/db/session.py`, `py_backend/app/db/models.py`, `py_backend/app/db/schemas.py`
- `py_backend/tests/conftest.py`
- `web-ui/app/api/*`, `web-ui/app/lib/fetcher.ts`, `web-ui/__tests__/test-utils/msw/handlers.ts`
- `docker-compose.yml`, `Makefile`

Guidance for AI contributors
- Prefer reading the API modules and `msw` handlers to infer contract details before writing tests or UI behavior.
- For backend DB changes, update tests to match conftest in `py_backend/tests/conftest.py` (in-memory engine + dependency override).
- Keep responses / status codes consistent with MSW handlers where the UI expects particular error/status behaviors (e.g., 400 for missing uploadId, 409 for invalid envelope assignment).

Questions?
- If anything here is unclear or you want expanded examples (e.g., a sample request/response or a small integration test template), say which section and I’ll iterate.