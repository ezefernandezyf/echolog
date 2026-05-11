import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, renderHook, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mock the API client — vi.mock is hoisted, so use vi.fn() inside the factory
// ---------------------------------------------------------------------------
vi.mock('../../core/api-client', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
  workspaceApi: { list: vi.fn(), create: vi.fn() },
  boardApi: { list: vi.fn(), create: vi.fn() },
  postApi: { list: vi.fn(), create: vi.fn(), updateStatus: vi.fn() },
  voteApi: { toggle: vi.fn() },
  commentApi: { list: vi.fn(), create: vi.fn() },
  apiClient: {},
  fetchJson: vi.fn(),
  createFetcher: vi.fn(),
  createVoidFetcher: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Import the mocked module so we can control it
import { authApi } from '../../core/api-client';
import type { AuthSessionDTO } from '../../../../shared/contracts/index.js';
import { useSession } from '../use-session';
import { useAuthStore } from '../auth-store';
import { ProtectedRoute, PublicRoute } from '../auth-guard';
import { LoginForm } from '../components/login-form';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sampleSession: AuthSessionDTO = {
  user: {
    id: 'user-1',
    email: 'alice@echolog.dev',
    name: 'Alice',
  },
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Reset store and DOM between tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  useAuthStore.setState({ session: null, status: 'unknown' });
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// ===========================================================================
// 1. Session Bootstrap (useSession hook)
// ===========================================================================
describe('Session bootstrap via useSession', () => {
  it('hydrates the session when /api/auth/me returns a user', async () => {
    vi.mocked(authApi.me).mockResolvedValue(sampleSession);

    const { result } = renderHook(() => useSession(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(sampleSession);

    // The Zustand store should be updated automatically by the useEffect in useSession
    const storeSession = useAuthStore.getState().session;
    expect(storeSession).toEqual(sampleSession);
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('keeps session null when /api/auth/me returns 401', async () => {
    vi.mocked(authApi.me).mockRejectedValue({ response: { status: 401 } });

    const { result } = renderHook(() => useSession(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });
});

// ===========================================================================
// 2. Route Guards
// ===========================================================================
describe('ProtectedRoute', () => {
  it('shows loading when session status is unknown', () => {
    useAuthStore.setState({ session: null, status: 'unknown' });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<p>Dashboard</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', () => {
    useAuthStore.setState({ session: null, status: 'unauthenticated' });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/login" element={<p>Login Page</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<p>Dashboard</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // ProtectedRoute should navigate to /login
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('renders child routes when authenticated', () => {
    useAuthStore.setState({ session: sampleSession, status: 'authenticated' });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/login" element={<p>Login Page</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<p>Dashboard</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});

describe('PublicRoute', () => {
  it('redirects to / when authenticated', () => {
    useAuthStore.setState({ session: sampleSession, status: 'authenticated' });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/" element={<p>Home</p>} />
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<p>Login Page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('renders login form when unauthenticated', () => {
    useAuthStore.setState({ session: null, status: 'unauthenticated' });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<p>Login Page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});

// ===========================================================================
// 3. Login Form
// ===========================================================================
describe('LoginForm', () => {
  it('submits credentials and updates session state', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ session: null, status: 'unauthenticated' });
    vi.mocked(authApi.login).mockResolvedValue(sampleSession);

    render(<LoginForm />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');

    await user.type(emailInput, 'alice@echolog.dev');
    await user.type(passwordInput, 'secret123');

    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(useAuthStore.getState().session).toEqual(sampleSession);
      expect(useAuthStore.getState().status).toBe('authenticated');
    });

    // mutationFn in RQ v5 receives (variables, mutationContext) — two positional args
    expect(vi.mocked(authApi.login)).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(authApi.login).mock.calls[0];
    expect(callArgs[0]).toEqual(
      expect.objectContaining({ email: 'alice@echolog.dev', password: 'secret123' }),
    );
  });

  it('shows error message on failed login', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'));

    render(<LoginForm />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');

    await user.type(emailInput, 'bad@echolog.dev');
    await user.type(passwordInput, 'wrong');

    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    expect(useAuthStore.getState().session).toBeNull();
  });

  it('renders a link to the registration page', () => {
    render(<LoginForm />, { wrapper: TestWrapper });

    const registerLink = screen.getByRole('link', { name: 'Create one' });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });
});
