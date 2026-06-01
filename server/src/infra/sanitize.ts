import sanitizeHtml from 'sanitize-html';

export function sanitizeInput(text: string): string {
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
}
