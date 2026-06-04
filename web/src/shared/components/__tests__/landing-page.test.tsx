import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LandingPage } from '../landing-page';

function renderLandingPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  cleanup();
});

afterEach(() => {
  cleanup();
});

describe('LandingPage', () => {
  it('renders "Continue without account" CTA', () => {
    renderLandingPage();

    const ctas = screen.getAllByText('Continue without account');
    expect(ctas.length).toBeGreaterThan(0);
    expect(ctas[0]!.tagName).toBe('BUTTON');
  });

  it('renders "Get Started Free" CTA button', () => {
    renderLandingPage();

    const buttons = screen.getAllByText('Get Started Free');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders "See how it works" button', () => {
    renderLandingPage();

    const buttons = screen.getAllByText('See how it works');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders EchoLog hero heading', () => {
    renderLandingPage();

    const headings = screen.getAllByText('EchoLog');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('"See how it works" button navigates to /explore', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<p>Explore page</p>} />
        </Routes>
      </MemoryRouter>,
    );

    const button = screen.getByRole('button', { name: 'See how it works' });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Explore page')).toBeInTheDocument();
    });
  });

  it('no visible text contains em dash (U+2014)', () => {
    renderLandingPage();

    const { innerHTML } = document.body;
    // Em dash is \u2014 — it should not appear in visible rendered text
    expect(innerHTML).not.toContain('\u2014');
  });
});
