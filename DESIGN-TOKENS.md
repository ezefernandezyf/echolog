# EchoLog — Design System

> v1.1 Visual Redesign · Indigo + Coral · Bold/Creative × Minimal/Elegant

## Typography

| Token           | Font           | Usage                              |
| --------------- | -------------- | ---------------------------------- |
| `--font-sans`   | Satoshi        | Body text, UI labels, forms        |
| `--font-display`| Clash Display  | Headings, hero, landing            |
| `--font-mono`   | Geist Mono     | Badges, code, technical labels     |

**CSS source** (`web/src/index.css:6-8`):
```css
--font-sans: 'Satoshi', system-ui, sans-serif;
--font-display: 'Clash Display', 'Satoshi', system-ui, sans-serif;
--font-mono: 'Geist Mono', ui-monospace, SFMono-Regular, monospace;
```

### Type Scale

| CSS Size | Tailwind Utility      | Usage                      |
| -------- | --------------------- | -------------------------- |
| 11px     | `text-[11px]`         | Badges, overline labels    |
| 12px     | `text-xs`             | Sidebar meta, timestamps   |
| 14px     | `text-sm`             | Body text, button labels   |
| 16px     | `text-base`           | Input text, descriptions   |
| 18px     | `text-lg`             | Subtitles                  |
| 20px     | `text-xl`             | Section headings           |
| 24px     | `text-2xl`            | Card titles                |
| 30px     | `text-3xl`            | Auth page headings         |
| 36px     | `text-4xl`            | Landing section headings   |
| 48px+   | `text-5xl`–`text-8xl` | Hero heading               |

---

## Colors

All colors use **OKLCH** for perceptual uniformity. Tokens live in `@theme` block (`web/src/index.css:5-50`).

### Brand

| Tailwind Class   | CSS Variable              | OKLCH Value        | Usage                           |
| ---------------- | ------------------------- | ------------------ | ------------------------------- |
| `bg-primary`     | `--color-primary`         | `oklch(0.48 0.19 265)` | Buttons, links, active states |
| `text-primary-foreground` | `--color-primary-foreground` | `oklch(0.98 0 0)` | Text on primary backgrounds |
| `bg-accent`      | `--color-accent`          | `oklch(0.65 0.18 35)` | CTAs, highlights, emphasis   |
| `text-accent-foreground` | `--color-accent-foreground` | `oklch(0.15 0.02 35)` | Text on accent backgrounds |

### Surface

| Tailwind Class             | CSS Variable                  | OKLCH Value        | Usage                      |
| -------------------------- | ----------------------------- | ------------------ | -------------------------- |
| `bg-background`            | `--color-background`          | `oklch(0.98 0.002 70)` | Page background         |
| `text-foreground`          | `--color-foreground`          | `oklch(0.15 0.008 265)` | Primary text            |
| `bg-card`                  | `--color-card`                | `oklch(1 0 0)`       | Elevated containers        |
| `text-card-foreground`     | `--color-card-foreground`     | `oklch(0.15 0.008 265)` | Text on cards           |
| `bg-popover`               | `--color-popover`             | `oklch(1 0 0)`       | Dropdowns, tooltips        |
| `text-popover-foreground`  | `--color-popover-foreground`  | `oklch(0.15 0.008 265)` | Text on popovers        |
| `bg-secondary`             | `--color-secondary`           | `oklch(0.96 0.003 70)` | Secondary surfaces      |
| `text-secondary-foreground`| `--color-secondary-foreground`| `oklch(0.2 0.01 265)` | Text on secondary backgrounds |
| `bg-muted`                 | `--color-muted`               | `oklch(0.96 0.003 70)` | Muted backgrounds        |
| `text-muted-foreground`    | `--color-muted-foreground`    | `oklch(0.5 0.01 265)` | Secondary text, placeholders |
| `border-border`            | `--color-border`              | `oklch(0.9 0.005 70)` | Dividers, card borders   |
| `border-input`             | `--color-input`               | `oklch(0.9 0.005 70)` | Input borders           |
| `ring-ring`                | `--color-ring`                | `oklch(0.48 0.19 265)` | Focus rings             |

### Semantic

| Tailwind Class                | CSS Variable                     | OKLCH Value        | Usage                     |
| ----------------------------- | -------------------------------- | ------------------ | ------------------------- |
| `text-destructive`            | `--color-destructive`            | `oklch(0.5 0.2 25)` | Errors, delete actions  |
| `text-destructive-foreground` | `--color-destructive-foreground` | `oklch(0.98 0 0)` | Text on destructive backgrounds |
| `text-success`                | `--color-success`                | `oklch(0.55 0.18 145)` | Confirmations          |
| `text-success-foreground`     | `--color-success-foreground`     | `oklch(0.98 0 0)` | Text on success backgrounds |
| `text-warning`                | `--color-warning`                | `oklch(0.7 0.15 85)` | Cautions               |
| `text-warning-foreground`     | `--color-warning-foreground`     | `oklch(0.15 0.02 85)` | Text on warning backgrounds |
| `text-info`                   | `--color-info`                   | `oklch(0.55 0.17 245)` | Informational states, unread indicators |
| `text-info-foreground`        | `--color-info-foreground`        | `oklch(0.98 0 0)` | Text on info backgrounds |

### Dark Mode

Activated via `.dark` class on `<html>` (`web/src/index.css:52-70`). All surface tokens invert:
- Background shifts from `oklch(0.98 ...)` to `oklch(0.13 0.005 265)`.
- Text shifts from dark (`oklch(0.15 ...)`) to light (`oklch(0.95 0.002 70)`).
- Border/input darken to `oklch(0.25 0.005 265)`.
- Accent softens to `oklch(0.6 0.16 35)` with light foreground.
- `color-scheme: dark` is set for native form controls.

---

## Shadows

| Tailwind Class | CSS Variable     | Value                                                              | Usage               |
| -------------- | ---------------- | ------------------------------------------------------------------ | ------------------- |
| `shadow-xs`    | `--shadow-xs`    | `0 1px 2px rgb(0 0 0 / 0.04)`                                    | Subtle elevation     |
| `shadow-sm`    | `--shadow-sm`    | `0 1px 3px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.04)`       | Cards, inputs        |
| `shadow-md`    | `--shadow-md`    | `0 4px 6px rgb(0 0 0 / 0.06), 0 2px 4px rgb(0 0 0 / 0.04)`       | Hover lift, modals   |
| `shadow-lg`    | `--shadow-lg`    | `0 10px 15px rgb(0 0 0 / 0.08), 0 4px 6px rgb(0 0 0 / 0.04)`     | Dropdowns            |
| `shadow-xl`    | `--shadow-xl`    | `0 20px 25px rgb(0 0 0 / 0.1), 0 10px 10px rgb(0 0 0 / 0.04)`    | Elevated modals      |
| `shadow-2xl`   | `--shadow-2xl`   | `0 25px 50px rgb(0 0 0 / 0.12)`                                  | Maximum elevation    |

All shadows use `rgb(0 0 0 / opacity)` — pure black with varying alpha. Each level has a primary shadow plus a secondary tight shadow for depth realism.

---

## Radius

| Tailwind Class    | CSS Variable    | Value   | Equivalent | Usage               |
| ----------------- | --------------- | ------- | ---------- | ------------------- |
| `rounded-sm`      | `--radius-sm`   | 0.375rem| 6px        | Small elements      |
| `rounded`         | `--radius`      | 0.5rem  | 8px        | Default rounding    |
| `rounded-md`      | `--radius-md`   | 0.625rem| 10px       | Medium elements     |
| `rounded-lg`      | `--radius-lg`   | 0.75rem | 12px       | Large containers    |
| `rounded-xl`      | `--radius-xl`   | 1rem    | 16px       | Buttons, inputs     |
| `rounded-2xl`     | `--radius-2xl`  | 1.25rem | 20px       | Cards, modals       |
| `rounded-full`    | *(default)*     | 9999px  | —          | Badges, avatars     |

**CSS source** (`web/src/index.css:37-42`):
```css
--radius-sm: 0.375rem;
--radius: 0.5rem;
--radius-md: 0.625rem;
--radius-lg: 0.75rem;
--radius-xl: 1rem;
--radius-2xl: 1.25rem;
```

---

## Animations

| Utility                      | Keyframe   | Duration | Easing    | Usage               |
| ---------------------------- | ---------- | -------- | --------- | ------------------- |
| `animate-fade-in`            | `fadeIn`   | 200ms    | ease-out  | Content appearing   |
| `animate-scale-in`           | `scaleIn`  | 150ms    | ease-out  | Modals, dialogs     |
| `animate-shimmer`            | `shimmer`  | 2s loop  | ease-in-out infinite | Loading skeletons |

**CSS source** (`web/src/index.css:101-145`):

```css
/* fadeIn: opacity 0→1 + translateY(8px→0) */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* scaleIn: opacity 0→1 + scale(0.95→1) */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

/* shimmer: background-position sweeps 200% → -200% */
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Global Transition Defaults

All elements get smooth color transitions by default (`web/src/index.css:76-83`):

```css
*, *::before, *::after {
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}
```

### Recommended Transition Utilities

| Utility                             | Duration | Usage                     |
| ----------------------------------- | -------- | ------------------------- |
| `transition-all duration-150`       | 150ms    | Button hover/press        |
| `transition-all duration-200`       | 200ms    | Card hover lift (default) |
| `transition-all duration-300`       | 300ms    | Slower reveals            |

### Motion Respect

All animations and transitions disable when the user has `prefers-reduced-motion: reduce` set at the OS level (`web/src/index.css:147-158`):

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0s !important;
    animation-duration: 0s !important;
  }
  .animate-shimmer {
    animation: none;
    background: var(--color-muted);
  }
}
```

Shimmer falls back to a solid muted background — no flashing for vestibular-sensitive users.

---

## Anti-Patterns (NEVER)

- ❌ `text-zinc-*` / `bg-zinc-*` — use semantic tokens (`text-foreground`, `bg-muted`)
- ❌ `var(--color-*)` in `className` — use Tailwind utilities (`bg-primary`, `text-foreground`)
- ❌ Hardcoded hex or OKLCH colors in JSX/TSX
- ❌ Raw `red-*` / `green-*` / `yellow-*` classes — use `text-destructive`, `text-success`, `text-warning`
- ❌ `ring-*` or `outline-*` custom focus styles — rely on `focus-visible:ring-ring`
- ❌ Inline `style={{ color: '...' }}` — move to Tailwind classes or CSS

---

## File Reference

All tokens are defined in a single source of truth:

```
web/src/index.css    — @theme block (tokens) + @keyframes (animations) + global resets + dark overrides
```

No token is duplicated elsewhere. Tailwind 4's `@theme` directive makes every `--color-*` available as `bg-*`, `text-*`, `border-*`, `ring-*`, etc., and every `--radius-*` as `rounded-*`.
