# Test-Driven Next.js App Router Frontend

## App Structure

A well-defined application structure is a good place to start.

```pgsql
/app
  /(onboarding)
    page.tsx
    components/
      UploadPrompt.tsx
      UploadProgress.tsx
    hooks/
      useOnboardingMachine.ts    // UI state machine wrapper
    actions/
      requestUploadUrls.ts       // (optional) server action → backend
  /(transactions)
    page.tsx
/lib
  /domain
    onboarding.ts                // pure domain logic (no fetch)
    types.ts                     // Transaction, Upload, etc (zod)
    ports.ts                     // interfaces: UploadPort, TxnPort
  /services                      // adapters to the outside world
    upload.service.ts            // implements UploadPort via fetch
    transactions.service.ts      // implements TxnPort via fetch
  /utils
    hashing.ts                   // content hash for idempotency
    dates.ts                     // “previous year” logic
/tests
  /unit                          // pure domain tests (fast)
  /contract                      // request/response shape via zod
  /integration                   // MSW-backed, page-level flows
  /e2e                           // playwright (happy path)
```
