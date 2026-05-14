import { slugify } from '../../shared/lib/slugify.js';

describe('slugify', () => {
  it('replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify(' My Workspace ')).toBe('my-workspace');
  });

  it('handles unicode characters by replacing them with hyphens', () => {
    expect(slugify('Café con leche')).toBe('caf-con-leche');
    expect(slugify('Straße')).toBe('stra-e');
    expect(slugify('日本語')).toBe('');
  });

  it('replaces special characters with hyphens', () => {
    expect(slugify('Feature! @#$% Requests')).toBe('feature-requests');
    expect(slugify('A&B Company')).toBe('a-b-company');
    expect(slugify('hello--world')).toBe('hello-world');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('---leading-dashes')).toBe('leading-dashes');
    expect(slugify('trailing-dashes---')).toBe('trailing-dashes');
    expect(slugify('---both---')).toBe('both');
  });

  it('handles empty input', () => {
    expect(slugify('')).toBe('');
    expect(slugify('   ')).toBe('');
  });

  it('handles consecutive special chars', () => {
    expect(slugify('hello!!!world')).toBe('hello-world');
    expect(slugify('foo___bar')).toBe('foo-bar');
  });

  it('preserves existing valid slugs', () => {
    expect(slugify('my-existing-slug')).toBe('my-existing-slug');
  });

  it('lowercases the input', () => {
    expect(slugify('UPPERCASE')).toBe('uppercase');
    expect(slugify('MixedCase')).toBe('mixedcase');
  });
});
