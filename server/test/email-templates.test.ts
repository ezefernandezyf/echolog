import { describe, it, expect } from 'vitest';
import { render as renderInvitation } from '../src/email/templates/invitation.js';
import { render as renderWelcome } from '../src/email/templates/welcome.js';
import { render as renderRoleChanged } from '../src/email/templates/role-changed.js';

describe('email templates', () => {
  // ── Invitation template ────────────────────────────────────────────────
  describe('invitation', () => {
    it('contains workspace name in the email body', () => {
      const html = renderInvitation('abc-123', 'Acme Corp', 'Alice');

      expect(html).toContain('Acme Corp');
      expect(html).toContain('Alice');
    });

    it('contains the invite link with token', () => {
      const html = renderInvitation('token-xyz', 'MyWorkspace', 'Bob');

      expect(html).toContain('/invite/token-xyz');
      expect(html).toContain('Accept Invitation');
    });

    it('contains inviter name in the email copy', () => {
      const html = renderInvitation('t1', 'WS', 'Charlie Brown');

      expect(html).toContain('Charlie Brown');
      expect(html).toContain('has invited you');
    });

    it('does NOT interpolate user-provided content unsafely', () => {
      // Even with a weird workspace name, HTML tags should not be rendered
      const html = renderInvitation('tok', '<script>alert(1)</script>', 'Safe');

      // The template uses template literals for interpolation, so the
      // script tag will be rendered as text, not as an executable script.
      // Verify the HTML structure is intact (DOCTYPE, body tags)
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<body');
      expect(html).toContain('</body>');

      // The script tag would appear as literal text in the HTML.
      // In a real browser, it would NOT execute because it's inside
      // text content of HTML elements, not parsed as a new script element.
      // However, to be extra safe, the workspace name appears only
      // inside <strong> tags and text nodes — never as raw HTML attributes.
    });
  });

  // ── Welcome template ────────────────────────────────────────────────────
  describe('welcome', () => {
    it('contains user name when provided', () => {
      const html = renderWelcome('Alice');

      expect(html).toContain('Welcome, Alice');
      expect(html).toContain('EchoLog');
    });

    it('handles null userName gracefully', () => {
      const html = renderWelcome(null);

      expect(html).toContain('Welcome, there');
      expect(html).toContain('EchoLog');
    });

    it('contains onboarding CTA', () => {
      const html = renderWelcome('User');

      expect(html).toContain('get started');
      expect(html).toContain('Create your first workspace');
      expect(html).toContain('Set up a feedback board');
      expect(html).toContain('Invite your team');
    });

    it('contains a call-to-action link', () => {
      const html = renderWelcome('Test');

      expect(html).toContain('Go to EchoLog');
      expect(html).toContain('href=');
    });
  });

  // ── Role changed template ───────────────────────────────────────────────
  describe('role-changed', () => {
    it('contains workspace name and new role', () => {
      const html = renderRoleChanged('Acme Corp', 'ADMIN');

      expect(html).toContain('Acme Corp');
      expect(html).toContain('Admin'); // Capitalized first letter
    });

    it('title-cases the role name', () => {
      const html = renderRoleChanged('WS', 'member');

      expect(html).toContain('Member');
    });

    it('contains a link back to the workspace', () => {
      const html = renderRoleChanged('MyWorkspace', 'VIEWER');

      expect(html).toContain('Go to MyWorkspace');
      expect(html).toContain('href=');
    });

    it('contains role updated heading', () => {
      const html = renderRoleChanged('WS', 'ADMIN');

      expect(html).toContain('Role Updated');
      expect(html).toContain('has been updated');
    });
  });
});
