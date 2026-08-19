/* Loads the real game files into a headless sandbox so the tests exercise
   exactly the code that ships, not a copy of it. */
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

/* Everything except main.js, which needs a real document. */
export const FILES = [
  'util.js', 'input.js', 'rig.js', 'anim.js', 'moves.js',
  'characters.js', 'audio.js', 'stagekit.js', 'stages.js', 'fighter.js', 'ai.js',
  'hud.js', 'game.js'
];

export function loadGame() {
  const listeners = {};
  const win = {
    addEventListener: (k, fn) => { (listeners[k] ||= []).push(fn); },
    removeEventListener: () => {},
    devicePixelRatio: 1,
    setInterval: () => 0,
    clearInterval: () => {},
    requestAnimationFrame: () => 0
  };
  const sandbox = {
    window: win,
    navigator: { getGamepads: () => [] },
    document: {
      readyState: 'complete',
      addEventListener: () => {},
      getElementById: () => null,
      createElement: () => ({ getContext: () => null })
    },
    console,
    Math, Date, JSON, Object, Array, String, Number, Boolean, Error,
    setInterval: () => 0, clearInterval: () => {},
    requestAnimationFrame: () => 0
  };
  sandbox.window.Math = Math;
  sandbox.globalThis = sandbox;
  const ctx = createContext(sandbox);

  for (const f of FILES) {
    const code = readFileSync(join(ROOT, 'src', f), 'utf8');
    runInContext(code, ctx, { filename: f });
  }
  const CF = sandbox.window.CF;
  if (!CF) throw new Error('CF namespace never appeared — check load order');
  return { CF, sandbox, listeners };
}

/* Every attacking move a character owns, with its key. */
export function attackMoves(chr) {
  const out = [];
  for (const [key, m] of Object.entries(chr.moves)) {
    if (m.noAttack || m.kind === 'system') continue;
    out.push([key, m]);
  }
  return out;
}
