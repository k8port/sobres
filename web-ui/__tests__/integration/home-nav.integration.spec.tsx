import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';

describe('Strategic disply of nav menu in home page after statement uploads successful', () => {
    beforeAll(() => {
        const user = userEvent.setup();
        render(<Home />);
    });

    it ('does not shows nav menu before user uploads statements', async () => {
        //  expect no nav menu is displayed
    });

    it('displays nav menu after first successful upload and save', async () => {
        // upload statement and get 2 success messages
        // exect nav menu to be displayed
    });

});