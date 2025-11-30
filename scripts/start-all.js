const { spawn } = require('child_process');

function startCommand(name, cmd, args) {
  const psArgs = ['-NoProfile', '-Command', `${cmd} ${args.join(' ')}`];
  const child = spawn('powershell.exe', psArgs, { stdio: 'inherit' });

  child.on('exit', (code, signal) => {
    console.log(`${name} exited with code ${code} ${signal ? `signal ${signal}` : ''}`);
  });

  child.on('error', (err) => {
    console.error(`${name} failed to start:`, err.message);
    process.exitCode = 1;
  });

  return child;
}

console.log('Starting dev server (vite) and json-server using PowerShell...');

const dev = startCommand('dev', 'npm', ['run', 'dev']);
const json = startCommand('json-server', 'npm', ['run', 'json-server']);

// Relay signals to children
function shutdown() {
  console.log('Shutting down children...');
  try { dev.kill(); } catch (e) {}
  try { json.kill(); } catch (e) {}
  process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
