import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CharCounter } from '../char-counter';

describe('CharCounter', () => {
  describe('visibility', () => {
    it('does not render when ratio is at or below showAt threshold', () => {
      const { container } = render(<CharCounter current={7} max={10} showAt={0.75} />);
      // 7/10 = 0.7 ≤ 0.75 → not visible
      expect(container.firstChild).toBeNull();

      const { container: container2 } = render(<CharCounter current={75} max={100} showAt={0.75} />);
      // 75/100 = 0.75 → not visible
      expect(container2.firstChild).toBeNull();
    });

    it('renders when ratio is above showAt threshold', () => {
      const { container } = render(<CharCounter current={8} max={10} showAt={0.75} />);
      // 8/10 = 0.8 > 0.75 → visible
      expect(container.firstChild).not.toBeNull();
    });

    it('uses default showAt of 0.75 when not provided', () => {
      const { container } = render(<CharCounter current={5} max={10} />);
      // 5/10 = 0.5 ≤ 0.75 → not visible
      expect(container.firstChild).toBeNull();

      const { container: container2 } = render(<CharCounter current={8} max={10} />);
      // 8/10 = 0.8 > 0.75 → visible
      expect(container2.firstChild).not.toBeNull();
    });

    it('is visible at any ratio > 0 when showAt=0', () => {
      const { container } = render(<CharCounter current={1} max={100} showAt={0} />);
      // 1/100 = 0.01 > 0 → visible
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('color classes', () => {
    it('uses zinc-400 class below 90%', () => {
      // 1% → zinc-400
      const { container: c } = render(<CharCounter current={1} max={100} showAt={0} />);
      expect(c.querySelector('p')).toHaveClass('text-zinc-400');

      // 50% → zinc-400
      const { container: c2 } = render(<CharCounter current={50} max={100} showAt={0} />);
      expect(c2.querySelector('p')).toHaveClass('text-zinc-400');

      // 80% → zinc-400 (0.8 < 0.9)
      const { container: c3 } = render(<CharCounter current={80} max={100} showAt={0} />);
      expect(c3.querySelector('p')).toHaveClass('text-zinc-400');
    });

    it('uses amber-500 class at 90% to 99%', () => {
      // 90% → amber-500
      const { container: c } = render(<CharCounter current={90} max={100} showAt={0} />);
      expect(c.querySelector('p')).toHaveClass('text-amber-500');

      // 95% → amber-500
      const { container: c2 } = render(<CharCounter current={95} max={100} showAt={0} />);
      expect(c2.querySelector('p')).toHaveClass('text-amber-500');
    });

    it('uses red-600 class at 100% and above', () => {
      // 100% → red-600
      const { container: c } = render(<CharCounter current={100} max={100} showAt={0} />);
      expect(c.querySelector('p')).toHaveClass('text-red-600');

      // 120% → red-600
      const { container: c2 } = render(<CharCounter current={120} max={100} showAt={0} />);
      expect(c2.querySelector('p')).toHaveClass('text-red-600');
    });
  });

  describe('display text', () => {
    it('shows current/max format', () => {
      render(<CharCounter current={42} max={120} showAt={0} />);
      expect(screen.getByText('42/120')).toBeInTheDocument();
    });

    it('hides counter when ratio is 0 with default showAt', () => {
      const { container } = render(<CharCounter current={0} max={500} showAt={0} />);
      // At ratio 0 with showAt 0, 0 ≤ 0 → not rendered.
      expect(container.firstChild).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles max=0 gracefully', () => {
      const { container } = render(<CharCounter current={5} max={0} showAt={0} />);
      // ratio divisor is max=0, guarded to 0; 0 ≤ 0 → not rendered
      expect(container.firstChild).toBeNull();
    });
  });
});
