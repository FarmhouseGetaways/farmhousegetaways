/* ==========================================================================
   Super Cat Fighter 6 — utilities
   ========================================================================== */
var CF = window.CF || {};
window.CF = CF;

CF.util = (function () {
  var DEG = Math.PI / 180;

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function sign(v) { return v < 0 ? -1 : (v > 0 ? 1 : 0); }
  function approach(v, target, step) {
    if (v < target) return Math.min(v + step, target);
    if (v > target) return Math.max(v - step, target);
    return v;
  }
  // ease used between animation keyframes: gentle in, hard out — reads punchy
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // Deterministic PRNG. A fighting game must not desync on a Math.random().
  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967296;
    };
  }

  function deepMerge(base, over) {
    var out = {}, k;
    for (k in base) out[k] = base[k];
    for (k in over) {
      if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) &&
          base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
        out[k] = deepMerge(base[k], over[k]);
      } else {
        out[k] = over[k];
      }
    }
    return out;
  }

  return {
    DEG: DEG, clamp: clamp, lerp: lerp, sign: sign, approach: approach,
    ease: ease, rectsOverlap: rectsOverlap, rng: rng, deepMerge: deepMerge
  };
})();
