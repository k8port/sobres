import '@testing-library/jest-dom';
import { server } from './app/__tests__/test-utils/msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
