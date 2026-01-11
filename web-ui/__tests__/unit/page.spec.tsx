import { render, screen } from "@testing-library/react";
import Home from "../../app/page";

test('Page', () => {
    render(<Home />);

    expect(
        screen.getByRole(
            'heading',
            { level: 1, name: 'Above Money, Beyond Survival' }
        ))
        .toBeDefined();

    expect(screen.getByRole(
        'button',
        { name: 'Upload Account Statement' })
    ).toBeDefined();

    expect(screen.getByAltText(/Sobres logo/i))
        .toBeDefined();

    expect(screen.getByText(/Bank Statement Upload/i))
        .toBeDefined();

    expect(screen.getByLabelText(/Upload Account Statement/i))
        .toBeDefined();

})