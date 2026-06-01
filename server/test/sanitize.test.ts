import { sanitizeInput } from '../src/infra/sanitize.js';

describe('sanitizeInput', () => {
  it('strips script tags', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('');
  });

  it('strips img with onerror', () => {
    expect(sanitizeInput('<img src=x onerror=alert(1)>')).toBe('');
  });

  it('strips nested HTML but keeps text', () => {
    expect(sanitizeInput('<p>Hello <b>World</b></p>')).toBe('Hello World');
  });

  it('passes plain text unchanged', () => {
    expect(sanitizeInput('Just some text')).toBe('Just some text');
  });

  it('handles empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('preserves special characters', () => {
    // sanitize-html encodes & to &amp; for HTML safety
    expect(sanitizeInput('Dolores & cambios €50')).toBe('Dolores &amp; cambios €50');
  });

  it('strips iframe', () => {
    expect(sanitizeInput('<iframe src="evil"></iframe>')).toBe('');
  });
});
