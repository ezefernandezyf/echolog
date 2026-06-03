import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../landing-page';

function renderLandingPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

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
});
