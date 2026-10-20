/**
 * electron-builder `afterSign` hook: VMP-sign the Windows app after code signing, as EVS
 * requires (see vmp-sign.cjs).
 */
const { vmpSign } = require('./vmp-sign.cjs');

exports.default = (context) => vmpSign(context, ['win32']);
