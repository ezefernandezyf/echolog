import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Resolve workspace root (two levels up from e2e/scripts/) ────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(__dirname, '..', '..');
const isWin = process.platform === 'win32';

// ── Cross-platform process tree kill ────────────────────────────────────────
function killTree(pid) {
  if (isWin) {
    spawn('taskkill', ['/pid', String(pid), '/f', '/t'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      // already dead — ignore
    }
  }
}

// ── Poll a URL until it returns 200 ─────────────────────────────────────────
async function waitForUrl(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // server not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timeout waiting for ${url} after ${timeoutMs}ms`);
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const server = spawn('node', ['e2e/scripts/start-dev.mjs'], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    shell: isWin,
  });

  // Cleanup on signals / normal exit
  process.on('exit', () => killTree(server.pid));
  process.on('SIGINT', () => {
    killTree(server.pid);
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    killTree(server.pid);
    process.exit(0);
  });

  // Fail fast if start-dev dies before health checks pass
  server.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`[e2e] start-dev exited with code ${code}`);
      process.exit(code);
    }
  });
  server.on('error', (err) => {
    console.error('[e2e] start-dev failed:', err.message);
    process.exit(1);
  });

  // Poll backends
  console.error('[e2e] Waiting for backend health check...');
  await waitForUrl('http://localhost:3000/health', 120_000);
  console.error('[e2e] Backend healthy on :3000');

  console.error('[e2e] Waiting for frontend...');
  await waitForUrl('http://localhost:5173/login', 30_000);
  console.error('[e2e] Frontend ready on :5173');

  // Run Playwright tests, forwarding extra CLI args
  const args = process.argv.slice(2);
  const pw = spawn('pnpm', ['--filter', '@echolog/e2e', 'exec', 'playwright', 'test', ...args], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    shell: isWin,
  });

  pw.on('exit', (code) => {
    killTree(server.pid);
    process.exit(code || 0);
  });
  pw.on('error', (err) => {
    console.error('[e2e] Playwright failed:', err.message);
    killTree(server.pid);
    process.exit(1);
  });
}

main();
