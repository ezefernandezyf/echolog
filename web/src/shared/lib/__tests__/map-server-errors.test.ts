import { vi, describe, it, expect } from 'vitest';
import { mapServerErrors } from '../map-server-errors';
import type { UseFormSetError } from 'react-hook-form';

function createMockSetError() {
  return vi.fn() as unknown as UseFormSetError<Record<string, unknown>>;
}

describe('mapServerErrors', () => {
  it('maps structured issues to setError calls and returns null', () => {
    const setError = createMockSetError();
    const error = {
      details: {
        issues: [
          { path: ['name'], message: 'Name is required' },
          { path: ['slug'], message: 'Slug already exists' },
        ],
      },
    };

    const result = mapServerErrors(error, setError);

    expect(result).toBeNull();
    expect(setError).toHaveBeenCalledTimes(2);
    expect(setError).toHaveBeenCalledWith('name', { message: 'Name is required' });
    expect(setError).toHaveBeenCalledWith('slug', { message: 'Slug already exists' });
  });

  it('handles single issue', () => {
    const setError = createMockSetError();
    const error = {
      details: {
        issues: [{ path: ['body'], message: 'Comment cannot be empty' }],
      },
    };

    const result = mapServerErrors(error, setError);

    expect(result).toBeNull();
    expect(setError).toHaveBeenCalledTimes(1);
    expect(setError).toHaveBeenCalledWith('body', { message: 'Comment cannot be empty' });
  });

  it('handles nested path (array index) correctly', () => {
    const setError = createMockSetError();
    const error = {
      details: {
        issues: [{ path: ['items', 0, 'name'], message: 'Invalid item name' }],
      },
    };

    const result = mapServerErrors(error, setError);

    expect(result).toBeNull();
    expect(setError).toHaveBeenCalledWith('items.0.name', { message: 'Invalid item name' });
  });

  it('returns fallback message when issues array is empty', () => {
    const setError = createMockSetError();
    const error = {
      details: { issues: [] },
    };

    const result = mapServerErrors(error, setError);

    expect(result).toBe('An unexpected error occurred');
    expect(setError).not.toHaveBeenCalled();
  });

  it('returns fallback message when details is missing', () => {
    const setError = createMockSetError();
    const error = { message: 'Something went wrong' };

    const result = mapServerErrors(error, setError);

    expect(result).toBe('Something went wrong');
    expect(setError).not.toHaveBeenCalled();
  });

  it('returns fallback message when error has no details or message', () => {
    const setError = createMockSetError();
    const error = {};

    const result = mapServerErrors(error, setError);

    expect(result).toBe('An unexpected error occurred');
    expect(setError).not.toHaveBeenCalled();
  });

  it('handles null error gracefully', () => {
    const setError = createMockSetError();

    const result = mapServerErrors(null, setError);

    expect(result).toBe('An unexpected error occurred');
    expect(setError).not.toHaveBeenCalled();
  });

  it('handles undefined error gracefully', () => {
    const setError = createMockSetError();

    const result = mapServerErrors(undefined, setError);

    expect(result).toBe('An unexpected error occurred');
    expect(setError).not.toHaveBeenCalled();
  });

  it('returns generic message for non-object errors', () => {
    const setError = createMockSetError();

    const result = mapServerErrors('string error', setError);

    expect(result).toBe('An unexpected error occurred');
    expect(setError).not.toHaveBeenCalled();
  });

  it('handles Axios-style error with message on the error object', () => {
    const setError = createMockSetError();
    const error = {
      message: 'Request failed with status code 409',
      response: {
        data: {
          message: 'Workspace slug already exists',
        },
      },
    };

    const result = mapServerErrors(error, setError);

    expect(result).toBe('Request failed with status code 409');
    expect(setError).not.toHaveBeenCalled();
  });
});
