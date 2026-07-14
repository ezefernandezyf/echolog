import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
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

        {state === 'loading' && <p className="text-muted-foreground">Verifying your email...</p>}

        {state === 'success' && (
          <>
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-success/15 dark:bg-success/10">
              <CheckCircle size={48} className="mx-auto" weight="fill" aria-hidden="true" />
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
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-destructive/15 dark:bg-destructive/10">
              <XCircle size={48} className="mx-auto" weight="fill" aria-hidden="true" />
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
