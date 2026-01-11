// turns handler into server instance
import { setupServer } from 'msw/node'
import { handlers, clearCaptured, lastTransactionsBody } from './handlers'

export const server = setupServer(...handlers);
export { clearCaptured, lastTransactionsBody };

export function resetInterceptors() {
    clearCaptured();
}
