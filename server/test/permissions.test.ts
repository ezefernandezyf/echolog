import { describe, it, expect } from 'vitest';
import { checkPermission } from '../src/infra/permissions.js';

describe('checkPermission', () => {
  describe('OWNER role', () => {
    it('passes when required level is OWNER', () => {
      expect(checkPermission('OWNER', 'OWNER')).toBe(true);
    });

    it('passes when required level is ADMINS', () => {
      expect(checkPermission('ADMINS', 'OWNER')).toBe(true);
    });

    it('passes when required level is MEMBERS', () => {
      expect(checkPermission('MEMBERS', 'OWNER')).toBe(true);
    });

    it('passes when required level is NOBODY (owner always bypasses)', () => {
      expect(checkPermission('NOBODY', 'OWNER')).toBe(true);
    });
  });

  describe('ADMIN role', () => {
    it('fails when required level is OWNER', () => {
      expect(checkPermission('OWNER', 'ADMIN')).toBe(false);
    });

    it('passes when required level is ADMINS', () => {
      expect(checkPermission('ADMINS', 'ADMIN')).toBe(true);
    });

    it('passes when required level is MEMBERS', () => {
      expect(checkPermission('MEMBERS', 'ADMIN')).toBe(true);
    });

    it('fails when required level is NOBODY', () => {
      expect(checkPermission('NOBODY', 'ADMIN')).toBe(false);
    });
  });

  describe('MEMBER role', () => {
    it('fails when required level is OWNER', () => {
      expect(checkPermission('OWNER', 'MEMBER')).toBe(false);
    });

    it('fails when required level is ADMINS', () => {
      expect(checkPermission('ADMINS', 'MEMBER')).toBe(false);
    });

    it('passes when required level is MEMBERS', () => {
      expect(checkPermission('MEMBERS', 'MEMBER')).toBe(true);
    });

    it('fails when required level is NOBODY', () => {
      expect(checkPermission('NOBODY', 'MEMBER')).toBe(false);
    });
  });

  describe('VIEWER role', () => {
    it('fails for OWNER required level', () => {
      expect(checkPermission('OWNER', 'VIEWER')).toBe(false);
    });

    it('fails for ADMINS required level', () => {
      expect(checkPermission('ADMINS', 'VIEWER')).toBe(false);
    });

    it('fails for MEMBERS required level', () => {
      expect(checkPermission('MEMBERS', 'VIEWER')).toBe(false);
    });

    it('fails for NOBODY required level', () => {
      expect(checkPermission('NOBODY', 'VIEWER')).toBe(false);
    });
  });

  describe('unknown roles default to false', () => {
    it('returns false for unknown required level', () => {
      expect(checkPermission('UNKNOWN_PERMISSION', 'OWNER')).toBe(false);
    });

    it('returns false for unknown user role', () => {
      expect(checkPermission('MEMBERS', 'UNKNOWN_ROLE')).toBe(false);
    });
  });
});
