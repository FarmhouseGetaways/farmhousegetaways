/* Regenerates MOVES.md straight from src/characters.js, so the command list
   can never quietly disagree with the game.

       node tools/gen-moves.mjs
*/
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadGame } from '../test/harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const { CF } = loadGame();

const MOTION_NAMES = {
  qcf: 'down, down-forward, forward',
  qcb: 'down, down-back, back',
  dp: 'forward, down, down-forward',
  rdp: 'back, down, down-back',
  hcf: 'back, down, forward (half circle)',
  hcb: 'forward, down, back (half circle)',
  qcfx2: 'fireball motion twice',
  p360: 'forward, down, back, up (full circle)',
  mash: 'tap rapidly',
  pp: 'hold two punches',
  chargeSuper: 'charge, then'
};

function inputOf(m) {
  const btns = (m.buttons || []).join(' / ');
  if (m.charge) {
    const dir = m.charge === 'bf' ? 'hold BACK' : 'hold DOWN';
    const then = m.charge === 'bf' ? 'forward' : 'up';
    return `${dir} ${m.chargeFrames || 40}f, then ${then} + ${btns}`;
  }
  const base = MOTION_NAMES[m.motion] || m.motion;
  return m.motion === 'mash' ? `${base} ${btns}` : `${base} + ${btns}`;
}

/* Frame advantage if the move connects on its first active frame. */
function advantage(m, stunKey) {
  const stun = m[stunKey];
  if (!stun || !m.active || !m.recovery) return null;
  const attackerLeft = (m.active - 1) + m.recovery;
  const adv = stun - attackerLeft;
  return (adv >= 0 ? '+' : '') + adv;
}

function dmgOf(m) {
  if (m.spawn) {
    const s = [0, 1, 2].map(i => m.spawn({ x: 0, facing: 1, side: 0, fx: [] }, i, 0).damage);
    return s[0] === s[2] ? String(s[0]) : s.join(' / ');
  }
  if (Array.isArray(m.damage)) {
    return m.damage[0] === m.damage[2] ? String(m.damage[0]) : m.damage.join(' / ');
  }
  return m.damage != null ? String(m.damage) : '—';
}

function notesOf(m) {
  const n = [];
  if (m.hitLevel === 'low') n.push('must be blocked low');
  if (m.hitLevel === 'overhead') n.push('must be blocked standing');
  if (m.knockdown === 'hard') n.push('hard knockdown');
  else if (m.knockdown === 'soft') n.push('knockdown');
  if (m.invuln) n.push(`invincible frames ${m.invuln[0]}–${m.invuln[1]}`);
  if (m.invulnHigh) n.push('ducks high attacks');
  if (m.lowProfile) n.push('goes under high attacks');
  if (m.armor) n.push('absorbs one hit');
  if (m.multiHit) n.push(`hits ${m.multiHit}×`);
  if (m.antiAir) n.push('anti-air');
  if (m.isCommandThrow) n.push('unblockable command grab');
  if (m.spawn || m.spawnMany) n.push('projectile');
  if (m.cancel && m.cancel.length) n.push(`cancels into ${m.cancel.join(' / ')}`);
  if (m.cost) n.push(`costs ${m.cost} meter`);
  return n.join('; ') || '—';
}

const NORMAL_ROWS = [
  ['stLP', 'Standing', 'LP'], ['stMP', 'Standing', 'MP'], ['stHP', 'Standing', 'HP'],
  ['stLK', 'Standing', 'LK'], ['stMK', 'Standing', 'MK'], ['stHK', 'Standing', 'HK'],
  ['crLP', 'Crouching', 'down + LP'], ['crMP', 'Crouching', 'down + MP'], ['crHP', 'Crouching', 'down + HP'],
  ['crLK', 'Crouching', 'down + LK'], ['crMK', 'Crouching', 'down + MK'], ['crHK', 'Crouching', 'down + HK'],
  ['airLP', 'In the air', 'LP'], ['airMP', 'In the air', 'MP'], ['airHP', 'In the air', 'HP'],
  ['airLK', 'In the air', 'LK'], ['airMK', 'In the air', 'MK'], ['airHK', 'In the air', 'HK']
];

let out = `# Move list

Generated from \`src/characters.js\` by \`node tools/gen-moves.mjs\` — do not edit
this file by hand, edit the character data and run the generator again.

Frame data is in 60ths of a second. **Startup** is how long before the move can
hit, **active** is how long it can hit for, **recovery** is how long you are
stuck afterwards. **On hit** and **on block** are the frame advantage if the
move connects on its first active frame: a plus number means you act first
afterwards, a minus number means your opponent does.

All motions are written **facing right**. They mirror automatically when your
cat turns around.

---

## Universal

| Move | Input | Notes |
|---|---|---|
| Throw | \`LP\` + \`LK\`, or forward + \`HP\`/\`HK\` up close | Unblockable, hard knockdown |
| Back throw | back + \`LP\`+\`LK\` up close | Throws them behind you |
| Dash | tap forward twice | Only some cats have it |
| Back hop | tap back twice | Invincible on the way up |
| Block | hold back | No air blocking |
| Block low | hold down-back | Stops lows; loses to overheads |

`;

for (const c of CF.ROSTER) {
  const s = c.stats;
  out += `---

## ${c.displayName} — ${c.subtitle}

${c.blurb.replace(/\n/g, '  \n')}

**Health** ${s.health} · **Stun** ${s.stunMax} · **Walk** ${s.walkF} forward, ${s.walkB} back · **Jump** ${s.jumpVy} · **Weight** ${s.weight}${s.hasDash ? ' · has a dash' : ''}${s.airDash ? ' · has an air dash' : ''}

### Specials

| Move | Input | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|
`;
  for (const m of c.specials) {
    out += `| **${m.name}** | ${inputOf(m)} | ${dmgOf(m)} | ${m.startup} | ${m.active} | ${m.recovery} | ${notesOf(m)} |\n`;
  }
  out += `
### Super *

| Move | Input | Damage | Startup | Active | Recovery | Notes |
|---|---|---|---|---|---|---|
`;
  for (const m of c.supers) {
    out += `| **${m.name}** | ${inputOf(m)} | ${dmgOf(m)} | ${m.startup} | ${m.active} | ${m.recovery} | ${notesOf(m)} |\n`;
  }

  out += `
### Normals

| Stance | Button | Move | Damage | Startup | Active | Recovery | On hit | On block | Notes |
|---|---|---|---|---|---|---|---|---|---|
`;
  for (const [key, stance, input] of NORMAL_ROWS) {
    const m = c.moves[key];
    if (!m) continue;
    out += `| ${stance} | ${input} | ${m.name} | ${dmgOf(m)} | ${m.startup} | ${m.active} | ${m.recovery} | ${advantage(m, 'hitstun') ?? '—'} | ${advantage(m, 'blockstun') ?? '—'} | ${notesOf(m)} |\n`;
  }
  out += '\n';
}

out += `---

\\* **Every super was invented, not given.** The owner named two special moves
per cat and nothing else, so the supers are a first guess and are the first
thing to change on request.

---

## Stages

${CF.Stages.map(s => `- **${s.name}**`).join('\n')}
`;

writeFileSync(join(HERE, '..', 'MOVES.md'), out);
console.log('MOVES.md written —', out.split('\n').length, 'lines');
