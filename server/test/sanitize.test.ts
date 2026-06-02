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

  it('strips <b> tag but preserves inner text', () => {
    expect(sanitizeInput('<b>bold</b>')).toBe('bold');
  });

  it('preserves markdown bold syntax', () => {
    expect(sanitizeInput('**bold**')).toBe('**bold**');
  });

  it('preserves markdown italic syntax', () => {
    expect(sanitizeInput('*italic*')).toBe('*italic*');
  });

  it('preserves markdown link syntax', () => {
    expect(sanitizeInput('[click](https://example.com)')).toBe('[click](https://example.com)');
  });

  it('preserves markdown syntax while stripping HTML', () => {
    expect(sanitizeInput('**<b>bold</b>**')).toBe('**bold**');
    expect(sanitizeInput('*<i>italic</i>*')).toBe('*italic*');
    expect(sanitizeInput('[<a href="x">link</a>](url)')).toBe('[link](url)');
  });

  it('preserves markdown mixed with safe text', () => {
    expect(sanitizeInput('Hello **world**, this is *cool*')).toBe('Hello **world**, this is *cool*');
  });
});
