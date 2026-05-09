import { spawn } from 'node:child_process';
import {
  failGate,
  passGate,
  type ReleaseGateCheck,
} from '../../../../packages/intelligence-runtime/src/release-gates.js';

export async function commandGate(
  id: string,
  label: string,
  command: string[],
  cwd: string,
): Promise<ReleaseGateCheck> {
  const started = Date.now();
  const [bin, ...args] = command;
  if (!bin) {
    return failGate(id, label, { code: 'missing_command', message: 'Command is empty' });
  }

  const result = await run(bin, args, cwd);
  const durationMs = Date.now() - started;
  if (result.code === 0) return passGate(id, label, durationMs);
  return failGate(id, label, {
    code: 'command_failed',
    message: `${label} failed. Re-run the command locally to see full output.`,
    details: { command: command.join(' '), output: result.output.slice(-4000) },
  }, durationMs);
}

function run(
  bin: string,
  args: string[],
  cwd: string,
): Promise<{ code: number | null; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(bin, args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('error', (err) => {
      resolve({ code: 1, output: err.message });
    });
    child.on('close', (code) => {
      resolve({ code, output });
    });
  });
}
