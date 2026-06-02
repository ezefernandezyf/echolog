import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schemasContent = readFileSync(
  resolve(__dirname, '../../shared/contracts/schemas.ts'),
  'utf-8',
);

describe('output encoding JSDoc annotations', () => {
  const jsdocAnnotation = '/** Plain text — not HTML-safe. React escapes on render. */';

  it('documents all 9 user-generated fields as plain text, not HTML-safe', () => {
    // Count occurrences of the output encoding JSDoc annotation
    const matches = schemasContent.match(
      /\/\*\*\sPlain text — not HTML-safe\.\sReact escapes on render\.\s\*\//g,
    );
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(9);
  });

  const userGeneratedFields = [
    { schema: 'PostSchema', field: 'title' },
    { schema: 'PostSchema', field: 'body' },
    { schema: 'CommentSchema', field: 'body' },
    { schema: 'WorkspaceSchema', field: 'name' },
    { schema: 'BoardSchema', field: 'name' },
    { schema: 'BoardSchema', field: 'description' },
    { schema: 'AuthUserSchema', field: 'name' },
    { schema: 'MemberSchema', field: 'name' },
    { schema: 'NotificationSchema', field: 'message' },
  ];

  for (const { schema, field } of userGeneratedFields) {
    it(`documents ${schema}.${field} as plain text`, () => {
      // Verify that the JSDoc annotation appears near the field definition.
      // Pattern: the annotation should appear in the file, and the field
      // definition should follow close after the annotation.
      expect(schemasContent).toContain(jsdocAnnotation);

      // Find all annotation positions, then check that the field name follows
      // within a reasonable number of lines.
      const lines = schemasContent.split('\n');
      let annotationFound = false;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Plain text — not HTML-safe')) {
          // Check the next 5 lines for the field definition
          const nextLines = lines.slice(i + 1, i + 6).join('\n');
          if (nextLines.includes(`${field}:`)) {
            annotationFound = true;
            break;
          }
        }
      }

      expect(annotationFound).toBe(true);
    });
  }

  it('has no JSDoc annotation on non-user-generated fields like email', () => {
    // Email fields should NOT have the annotation because they're validated by Zod,
    // not user-generated free text.
    // Check each email field — the annotation must not appear on the 2 lines
    // immediately preceding or on the same line as the email field.
    const lines = schemasContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/^\s+email:/.test(lines[i])) {
        // Check only the immediately preceding line and the email line itself —
        // the JSDoc for 'name' may appear 2+ lines above but it documents 'name', not 'email'.
        const context = lines.slice(Math.max(0, i - 1), i + 1).join('\n');
        expect(context).not.toContain('Plain text — not HTML-safe');
      }
    }
  });
});
