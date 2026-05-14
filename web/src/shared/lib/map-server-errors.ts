import type { FieldValues, UseFormSetError } from 'react-hook-form';

interface ServerIssue {
  path: (string | number)[];
  message: string;
}

interface ErrorWithDetails {
  details?: {
    issues?: ServerIssue[];
  };
  message?: string;
}

/**
 * Parses structured server validation errors and maps them to RHF field errors.
 *
 * @returns `null` if all issues were mapped to fields, or a fallback message string
 *          (to be shown in a toast) if the error format is unrecognized.
 */
export function mapServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): string | null {
  if (error == null) {
    return 'An unexpected error occurred';
  }

  try {
    const err = error as ErrorWithDetails;
    const issues = err.details?.issues;

    if (!issues || issues.length === 0) {
      if (err.message) return err.message;
      return 'An unexpected error occurred';
    }

    for (const issue of issues) {
      const fieldName = issue.path.join('.');
      setError(fieldName as Parameters<UseFormSetError<T>>[0], {
        message: issue.message,
      });
    }

    return null;
  } catch {
    const err = error as ErrorWithDetails;
    return err.message ?? 'Failed to process server errors';
  }
}
