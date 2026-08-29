import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('\x1b[32m%s\x1b[0m', '════════════════════════════════════════════════════════════════');
console.log('\x1b[32m%s\x1b[0m', ' 🚀 Starting OmniBug v2.4 (Dual-Server Workspace)');
console.log('\x1b[32m%s\x1b[0m', '   • Backend API:  http://localhost:4000');
console.log('\x1b[32m%s\x1b[0m', '   • Frontend Web: http://localhost:5173');
console.log('\x1b[32m%s\x1b[0m', '════════════════════════════════════════════════════════════════\n');

function runService(name, cwd, color) {
  const child = spawn(npmCmd, ['run', 'dev'], {
    cwd: path.join(rootDir, cwd),
    stdio: 'pipe',
    shell: true,
  });

  child.stdout.on('data', data => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${color}[${name}]\x1b[0m ${line}`);
      }
    });
  });

  child.stderr.on('data', data => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.error(`${color}[${name}]\x1b[0m \x1b[31m${line}\x1b[0m`);
      }
    });
  });

  child.on('close', code => {
    console.log(`${color}[${name}]\x1b[0m Exited with code ${code}`);
  });

  return child;
}

const backendProcess = runService('backend', 'backend', '\x1b[36m');
const frontendProcess = runService('frontend', 'frontend', '\x1b[35m');

function cleanup() {
  console.log('\n\x1b[33mShutting down OmniBug development servers...\x1b[0m');
  try {
    if (backendProcess) backendProcess.kill();
    if (frontendProcess) frontendProcess.kill();
  } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
