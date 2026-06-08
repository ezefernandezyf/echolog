import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, renderHook, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mock the API client — vi.mock is hoisted, so use vi.fn() inside the factory
// ---------------------------------------------------------------------------
vi.mock('../../api/auth', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    updateEmail: vi.fn(),
    updatePassword: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Import the mocked module so we can control it
import { authApi } from '../../api/auth';
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
    emailVerified: false,
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
        <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
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
        <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('preserves React Query cache when /api/auth/me returns 401', async () => {
    vi.mocked(authApi.me).mockRejectedValue({ response: { status: 401 } });

    const queryClient = createTestQueryClient();
    // Pre-populate cache with data that should survive the 401 error
    queryClient.setQueryData(['cached-key'], { value: 'should-survive' });

    const { result } = renderHook(() => useSession(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Auth store should be cleared (clearSession was called)
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().status).toBe('unauthenticated');

    // React Query cache MUST be preserved — queryClient.clear() must NOT be called
    const cachedData = queryClient.getQueryData(['cached-key']);
    expect(cachedData).toEqual({ value: 'should-survive' });
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
  it('redirects to /w when authenticated on /login', () => {
    useAuthStore.setState({ session: sampleSession, status: 'authenticated' });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/w" element={<p>Home</p>} />
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<p>Login Page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects to /w when authenticated on /register', () => {
    useAuthStore.setState({ session: sampleSession, status: 'authenticated' });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/w" element={<p>Home</p>} />
          <Route element={<PublicRoute />}>
            <Route path="/register" element={<p>Register Page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Register Page')).not.toBeInTheDocument();
  });

  it('allows authenticated users to see the landing page at /', () => {
    useAuthStore.setState({ session: sampleSession, status: 'authenticated' });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/w" element={<p>Home</p>} />
          <Route element={<PublicRoute />}>
            <Route path="/" element={<p>Landing Page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // Should NOT redirect to /w — should render the landing page
    expect(screen.getByText('Landing Page')).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('allows authenticated users to browse /explore', () => {
    useAuthStore.setState({ session: sampleSession, status: 'authenticated' });

    render(
      <MemoryRouter initialEntries={['/explore']}>
        <Routes>
          <Route path="/w" element={<p>Home</p>} />
          <Route element={<PublicRoute />}>
            <Route path="/explore" element={<p>Explore Feed</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Explore Feed')).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('allows authenticated users to browse /explore/:slug', () => {
    useAuthStore.setState({ session: sampleSession, status: 'authenticated' });

    render(
      <MemoryRouter initialEntries={['/explore/some-workspace']}>
        <Routes>
          <Route path="/w" element={<p>Home</p>} />
          <Route element={<PublicRoute />}>
            <Route path="/explore/:slug" element={<p>Workspace View</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Workspace View')).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
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

    fireEvent.change(emailInput, { target: { value: 'alice@echolog.dev' } });
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });

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
    vi.mocked(authApi.login).mockRejectedValue({ message: 'Invalid credentials', status: 401 });

    render(<LoginForm />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });

    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
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
