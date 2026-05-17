import { spawn } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { mkdirSync, existsSync, unlinkSync } from 'node:fs';

// ── Resolve workspace root (two levels up from e2e/scripts/) ────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(__dirname, '..', '..');
const serverDir = resolve(workspaceRoot, 'server');
const webDir = resolve(workspaceRoot, 'web');
const isWin = process.platform === 'win32';
const PNPM = 'pnpm';

const children = [];

// ── Cross-platform cleanup ──────────────────────────────────────────────────
function killAll() {
  for (const child of children) {
    try {
      if (process.platform === 'win32') {
        // /t kills the entire process tree
        spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], {
          stdio: 'ignore',
        });
      } else {
        child.kill('SIGTERM');
      }
    } catch {
      // already dead — ignore
    }
  }
}

process.once('SIGINT', () => {
  killAll();
  process.exit(0);
});
process.once('SIGTERM', () => {
  killAll();
  process.exit(0);
});

// ── Helper: run a command and wait for exit ────────────────────────────────
function run(command, args, opts = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      // NOTE: On Windows, `pnpm` resolves to a .cmd shim.
      // Node can't spawn .cmd reliably without `shell: true`.
      shell: isWin,
      cwd: opts.cwd ?? workspaceRoot,
      ...opts,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolvePromise();
      else
        reject(
          new Error(`${command} ${args.join(' ')} exited with code ${code}`),
        );
    });
  });
}

// ── Ephemeral SQLite DB setup ──────────────────────────────────────────────
const tempBase = join(tmpdir(), 'echolog');
const runId = Date.now().toString(36);
const tempDir = join(tempBase, runId);

console.error(`[e2e] Creating ephemeral DB in ${tempDir}`);
mkdirSync(tempDir, { recursive: true });

// Prisma SQLite file: URLs use forward slashes on all platforms
const dbPath = join(tempDir, 'e2e.db');
const dbUrl = `file:${dbPath.replace(/\\/g, '/')}`;

// Clean up stale DB file from a previous interrupted run
if (existsSync(dbPath)) {
  unlinkSync(dbPath);
}

const dbEnv = { ...process.env, DATABASE_URL: dbUrl };

async function main() {
  try {
    // Step 1 — Run Prisma migrations on ephemeral DB
    console.error('[e2e] Running Prisma migrations on ephemeral DB...');
    await run(
      PNPM,
      ['--filter', '@echolog/server', 'exec', 'prisma', 'migrate', 'deploy'],
      { env: dbEnv, cwd: serverDir },
    );

    // Step 2 — Seed the ephemeral DB
    console.error('[e2e] Seeding ephemeral DB...');
    await run(
      PNPM,
      ['--filter', '@echolog/server', 'exec', 'tsx', 'prisma/seed.ts'],
      { env: dbEnv, cwd: serverDir },
    );

    // Step 3 — Start backend (Express + tsx watch, port 3000)
    console.error('[e2e] Starting backend on :3000...');
    const server = spawn(PNPM, ['--filter', '@echolog/server', 'dev'], {
      stdio: 'inherit',
      shell: isWin,
      // Run from the package directory so dotenv resolves `server/.env`.
      cwd: serverDir,
      env: dbEnv,
    });
    children.push(server);
    server.on('error', (err) => {
      console.error('[e2e] Backend failed to start:', err.message);
      killAll();
      process.exit(1);
    });
    server.on('exit', (code) => {
      if (code && code !== 0) {
        console.error(`[e2e] Backend exited early with code ${code}`);
        killAll();
        process.exit(code);
      }
    });

    // Step 4 — Start frontend (Vite dev server, port 5173)
    console.error('[e2e] Starting frontend on :5173...');
    // Force Vite to bind IPv4 so Playwright's webServer healthcheck can connect reliably on Windows.
    // Use `pnpm exec vite` so host/port flags are applied reliably.
    const web = spawn(
      PNPM,
      [
        '--filter',
        '@echolog/web',
        'exec',
        'vite',
        '--',
        // Bind IPv4 so Playwright can connect via 127.0.0.1.
        '--host',
        '0.0.0.0',
        '--port',
        '5173',
        '--strictPort',
      ],
      {
        stdio: 'inherit',
        shell: isWin,
        cwd: webDir,
        env: { ...process.env },
      },
    );
    children.push(web);
    web.on('error', (err) => {
      console.error('[e2e] Frontend failed to start:', err.message);
      killAll();
      process.exit(1);
    });
    web.on('exit', (code) => {
      if (code && code !== 0) {
        console.error(`[e2e] Frontend exited early with code ${code}`);
        killAll();
        process.exit(code);
      }
    });

    console.error('[e2e] Dev servers starting — backend :3000 | frontend :5173');
    console.error(`[e2e] Ephemeral DB: ${dbUrl}`);

    // Keep the process alive (Playwright kills it when tests finish)
    process.stdin.resume();
  } catch (err) {
    console.error('[e2e] Setup failed:', err.message);
    killAll();
    process.exit(1);
  }
}

main();
