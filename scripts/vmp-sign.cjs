/**
 * electron-builder `afterPack` hook: VMP-sign the packaged app with castLabs EVS.
 *
 * Spotify's Widevine licence server rejects clients that only carry castLabs' development VMP
 * signature (the licence request fails with a 500 and nothing plays). EVS gives the app a
 * production VMP signature. It's free but needs an account - see README "In-app audio".
 *
 * - macOS / Windows only (the Linux CDM has no VMP).
 * - Runs before code signing on macOS, as EVS requires. (Windows would need it after code
 *   signing; builds here aren't code-signed.)
 * - If EVS isn't installed or logged in, the build continues with a warning - the app then falls
 *   back to playing on the user's Spotify app. Set REQUIRE_VMP_SIGN=1 to fail instead.
 */
const { execFileSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

exports.default = async function vmpSign(context) {
  const platform = context.electronPlatformName;
  if (platform !== 'darwin' && platform !== 'win32') return;
  if (process.env.SKIP_VMP_SIGN) {
    console.log('  • VMP signing skipped (SKIP_VMP_SIGN set)');
    return;
  }

  // Prefer the project venv from `npm run vmp:setup`; CI sets PYTHON to its own interpreter.
  const venvPython = path.join(
    __dirname,
    '..',
    '.venv-evs',
    process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
  );
  const python =
    process.env.PYTHON || (existsSync(venvPython) ? venvPython : process.platform === 'win32' ? 'python' : 'python3');
  try {
    console.log(`  • VMP signing ${context.appOutDir}`);
    execFileSync(python, ['-m', 'castlabs_evs.vmp', '--no-ask', 'sign-pkg', context.appOutDir], {
      stdio: 'inherit',
    });
  } catch (err) {
    if (process.env.REQUIRE_VMP_SIGN) throw err;
    console.warn(
      '  ⚠ VMP signing failed or EVS is not set up - in-app Spotify playback will not work in this build.\n' +
        '    Run `npm run vmp:setup` and `npm run vmp:login` (or `vmp:signup` the first time).',
    );
  }
};
