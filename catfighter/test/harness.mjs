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
  'hud.js', 'card.js', 'game.js'
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

/* Build a real Game and run it, with no canvas and no browser. `step()` never
   touches the drawing context, so a whole match can be simulated in Node —
   which is the only way to catch a move that is correct on paper and does
   nothing in practice. */
export function headlessGame(CF) {
  const fakeCanvas = { getContext: () => null, addEventListener: () => {}, width: 384, height: 224 };
  const g = new CF.Game(fakeCanvas);
  g.render = () => {};
  return g;
}

/* Run `move` for `p1` against a stationary opponent placed `dist` away, and
   report how much damage actually landed. */
export function tryMove(CF, attackerId, move, opts = {}) {
  const g = headlessGame(CF);
  g.arcade = { step: 0, order: [] };
  g.startMatch(CF.byId(attackerId), CF.byId(opts.against || 'gracie'), 0, 'versus');
  g.p1.port = new CF.VirtualPort();
  g.p2.port = new CF.VirtualPort();
  for (let i = 0; i < 130; i++) g.step();          // through the round intro

  g.p2.x = g.p1.x + (opts.dist === undefined ? 55 : opts.dist);
  g.p2.health = g.p2.maxHealth;
  g.p1.meter = 100;
  if (opts.block) g.p2.port.holdDir = g.p2.facing > 0 ? 4 : 6;
  const before = g.p2.health;

  g.p1.setState('idle');
  g.p1.startMove(move, opts.strength === undefined ? 2 : opts.strength);
  g.p1.superFreeze = 0;
  for (let i = 0; i < (opts.frames || 180); i++) g.step();

  return { damage: before - g.p2.health, p2state: g.p2.state, p1state: g.p1.state };
}

/* A canvas context that draws nothing and remembers everything. The rig's
   rules about HOW a cat is drawn — one contour laid down before any fill,
   one light shared by every part — are invisible to a test that can only
   look at the finished pixels, and they are exactly the rules a later change
   breaks by accident. Recording the calls makes them checkable. */
export function recordingCtx() {
  const ops = [];
  const gradients = [];
  const ctx = {
    fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1,
    lineJoin: 'miter', lineCap: 'butt', font: '10px sans-serif',
    globalCompositeOperation: 'source-over',
    shadowColor: 'transparent', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
    imageSmoothingEnabled: true,
    ops, gradients,

    save() {}, restore() {},
    translate() {}, rotate() {}, scale() {}, setTransform() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    arc() {}, ellipse() {}, quadraticCurveTo() {}, rect() {}, clip() {},
    fillText() {}, measureText: () => ({ width: 0 }),
    drawImage() {},

    fill() { ops.push({ op: 'fill', style: this.fillStyle, alpha: this.globalAlpha }); },
    stroke() { ops.push({ op: 'stroke', style: this.strokeStyle, width: this.lineWidth }); },
    fillRect() { ops.push({ op: 'fillRect', style: this.fillStyle, alpha: this.globalAlpha }); },

    createLinearGradient(x0, y0, x1, y1) {
      const g = { kind: 'linear', x0, y0, x1, y1, stops: [],
                  addColorStop(o, c) { this.stops.push([o, c]); } };
      gradients.push(g);
      return g;
    },
    createRadialGradient() {
      const g = { kind: 'radial', stops: [], addColorStop(o, c) { this.stops.push([o, c]); } };
      gradients.push(g);
      return g;
    }
  };
  return ctx;
}
