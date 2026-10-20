/**
 * Runs the castLabs EVS client (VMP signing) from a project-local Python venv, so nothing is
 * installed into the system / Homebrew Python (which refuses global pip installs - PEP 668).
 *
 *   node scripts/evs.mjs setup       create .venv-evs and install castlabs-evs
 *   node scripts/evs.mjs signup      create the free EVS account (once)
 *   node scripts/evs.mjs login       log in again (tokens expire monthly)
 *   node scripts/evs.mjs sign-dev    VMP-sign node_modules/electron/dist
 *   node scripts/evs.mjs verify-dev  check that signature
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const venv = path.join(root, '.venv-evs');
const venvPython =
  process.platform === 'win32' ? path.join(venv, 'Scripts', 'python.exe') : path.join(venv, 'bin', 'python');
const systemPython = process.platform === 'win32' ? 'python' : 'python3';
const electronDist = path.join(root, 'node_modules', 'electron', 'dist');

const run = (cmd, args) => {
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit' });
  if (result.error) {
    console.error(`Could not run ${cmd}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {process.exit(result.status ?? 1);}
};

const setup = () => {
  if (!existsSync(venvPython)) {
    console.log('Creating .venv-evs ...');
    run(systemPython, ['-m', 'venv', venv]);
  }
  run(venvPython, ['-m', 'pip', 'install', '--quiet', '--upgrade', 'pip', 'castlabs-evs']);
  console.log('castlabs-evs is ready.');
};

const evs = (...args) => {
  if (!existsSync(venvPython)) {setup();}
  run(venvPython, ['-m', ...args]);
};

const commands = {
  login: () => evs('castlabs_evs.account', 'reauth'),
  setup,
  'sign-dev': () => evs('castlabs_evs.vmp', 'sign-pkg', electronDist),
  signup: () => evs('castlabs_evs.account', 'signup'),
  'verify-dev': () => evs('castlabs_evs.vmp', 'verify-pkg', electronDist),
};

const command = commands[process.argv[2]];
if (!command) {
  console.error(`Usage: node scripts/evs.mjs <${Object.keys(commands).join('|')}>`);
  process.exit(1);
}
command();
