import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchJson } from '../../api/client';
import { AuthCard } from './auth-card';

type VerifyState = 'loading' | 'success' | 'error';

interface VerifyResult {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
}

export function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<VerifyState>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('Invalid verification link.');
      return;
    }

    fetchJson<VerifyResult, void>({
      url: `/auth/verify-email/${token}`,
      method: 'GET',
    })
      .then(() => {
        setState('success');
        setMessage('Your email has been verified successfully!');
      })
      .catch((err) => {
        setState('error');
        setMessage(err?.message ?? 'Failed to verify email. The link may be expired or invalid.');
      });
  }, [token]);

  return (
    <AuthCard>
      <div className="text-center space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Email Verification</h1>

        {state === 'loading' && (
          <p className="text-muted-foreground">Verifying your email...</p>
        )}

        {state === 'success' && (
          <>
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <span className="text-2xl text-emerald-600 dark:text-emerald-400" aria-hidden="true">
                ✓
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Link
              to="/login"
              className="inline-block mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to login
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-red-100 dark:bg-red-900/30">
              <span className="text-2xl text-red-600 dark:text-red-400" aria-hidden="true">
                ✕
              </span>
            </div>
            <p className="text-sm text-destructive">{message}</p>
            <div className="flex flex-col gap-2 mt-2">
              <Link
                to="/login"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Go to login
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthCard>
  );
}
