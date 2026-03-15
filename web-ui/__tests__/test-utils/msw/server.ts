// turns handler into server instance
import { setupServer } from 'msw/node'
import { handlers, clearCaptured, lastTransactionsBody, clearUploadCaptured } from './handlers'

export const server = setupServer(...handlers);
export { clearCaptured, lastTransactionsBody, clearUploadCaptured };

export function resetInterceptors() {
    clearCaptured();
    clearUploadCaptured();
}
