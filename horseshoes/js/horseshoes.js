/* Hillside Horseshoes: the pitch in the hero. The scorecard has its own page now, /horseshoes/score/
   (js/score.js); the old in-page scorekeeper that lived here is gone. */

/* The pitch. The page is drawn with the shoe already ringing the far stake. Only once animation frames are
   actually running does the shoe leave it: the page opens with a ringer, and then the "Pitch another" pill
   goes round three throws, in order (Cory, 9 Oct 2026): one that bounces out, one close enough for a point,
   and a ringer.

   Motion: the flight is a true throw. The arc is a quadratic curve stepped evenly in time, so the shoe
   crosses at a steady speed and rises and falls under constant gravity. A bounce is a quick hop, about .2s
   up slowing to the top (quad ease-out) and .2s down speeding up (quad ease-in); a smaller hop is shorter,
   as it would be. Never floaty, never linear. A frozen timeline, a background tab or reduced motion leaves
   the ringer where it is; the timer below lands each throw regardless, so a shoe is never left mid-air. */
(function () {
  var scene = document.querySelector(".scene");
  if (!scene) return;
  var flyer = scene.querySelector("#flyer");
  var tag = scene.querySelector("#tag");
  var tagText = tag && tag.querySelector("text");
  var tagBox = tag && tag.querySelector("rect");
  var btn = document.querySelector(".pitch");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !flyer) return;

  var HAND = [514, 452], STAKE = [1083.5, 536];
  var outQ = function (u) { return 1 - (1 - u) * (1 - u); };
  var inQ = function (u) { return u * u; };

  function put(x, y, rot, sy) {
    flyer.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")" +
      (rot ? " rotate(" + rot.toFixed(1) + ")" : "") + (sy != null && sy !== 1 ? " scale(1 " + sy.toFixed(3) + ")" : ""));
  }
  // The arc from the thrower's hand to `end`, bending through `ctrl`. Even steps in time: a real throw.
  function flight(end, ctrl, dur) {
    return { dur: dur, step: function (k) {
      var u = 1 - k;
      put(u * u * HAND[0] + 2 * u * k * ctrl[0] + k * k * end[0],
          u * u * HAND[1] + 2 * u * k * ctrl[1] + k * k * end[1], k * 720);
    } };
  }
  // One hop along the ground from `a` to `b`, `h` high: rising over `half` ms, then falling over `half` ms.
  function hop(a, b, h, half, r0, r1, start) {
    function at(f, lift) {
      put(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f - h * lift, r0 + (r1 - r0) * f);
    }
    return [
      { dur: half, start: start, step: function (k) { at(k / 2, outQ(k)); } },
      { dur: half, step: function (k) { at(0.5 + k / 2, 1 - inQ(k)); } }
    ];
  }
  // The shoe tips over and lies flat: seen from the side, it squashes to a sliver.
  var FLAT = 0.38;

  var THROWS = {
    // Hits the sand in front of the stake, clangs it, hops back twice and skids out of the pit. No score.
    bounce: {
      segs: [flight([1080, 543], [797, 30], 1100)]
        .concat(hop([1080, 543], [1038, 543], 30, 200, 0, -360, function () { scene.classList.add("clang"); }))
        .concat(hop([1038, 543], [1004, 552], 12, 130, -360, -720))
        .concat([{ dur: 260, step: function (k) {
          var e = outQ(k);
          put(1004 - 24 * e, 552 + 3 * e, 0, 1 - (1 - FLAT) * outQ(Math.min(1, k * 2.5)));
        } }]),
      land: function () { scene.classList.add("off"); }
    },
    // Lands short of the stake, within a shoe-width, and lies flat there. One point.
    point: {
      segs: [flight([1054, 543], [784, 36], 1080),
        { dur: 110, step: function (k) { var e = outQ(k); put(1054, 543 + 6 * e, 0, 1 - (1 - FLAT) * e); } }],
      land: function () { scene.classList.add("off"); showTag("Close +1", 1054); }
    },
    // Around the stake: the ring, the ripples, the ding. Three points.
    ringer: {
      segs: [flight(STAKE, [800, 30], 1100)],
      land: function () {
        put(STAKE[0], STAKE[1]);
        void scene.getBoundingClientRect();
        scene.classList.add("rang");
        showTag("Ringer +3", STAKE[0]);
      }
    }
  };

  function showTag(text, x) {
    if (!tag || !tagText) return;
    tagText.textContent = text;
    var w = 96;
    try { w = Math.max(80, tagText.getComputedTextLength() + 30); } catch (e) { /* not laid out yet */ }
    if (tagBox) { tagBox.setAttribute("width", w.toFixed(0)); tagBox.setAttribute("x", (-w / 2).toFixed(1)); }
    tag.setAttribute("transform", "translate(" + x + " 476)");
    scene.classList.remove("tagged");
    void scene.getBoundingClientRect();
    scene.classList.add("tagged");
  }

  var busy = false;
  function pitch(name) {
    if (busy) return false;
    busy = true;
    var T = THROWS[name], segs = T.segs, cur = 0, started = -1, segStart = 0, t0 = null, done = false;
    var total = segs.reduce(function (a, s) { return a + s.dur; }, 0);
    var safety = setTimeout(finish, total + 1500);
    function begin() {
      scene.classList.remove("rang", "off", "clang", "tagged");
      scene.classList.add("throwing");
    }
    function finish() {
      if (done) return;
      done = true; busy = false;
      clearTimeout(safety);
      if (t0 === null) begin();
      for (; cur < segs.length; cur++) {
        if (started !== cur && segs[cur].start) segs[cur].start();
        segs[cur].step(1);
      }
      scene.classList.remove("throwing");
      T.land();
    }
    function frame(ts) {
      if (done) return;
      if (t0 === null) { t0 = ts; begin(); }
      var el = ts - t0;
      while (cur < segs.length) {
        var s = segs[cur];
        if (started !== cur) { started = cur; if (s.start) s.start(); }
        var k = s.dur ? (el - segStart) / s.dur : 1;
        if (k < 1) { s.step(Math.max(0, k)); break; }
        s.step(1); segStart += s.dur; cur++;
      }
      if (cur >= segs.length) finish(); else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return true;
  }

  setTimeout(function () { pitch("ringer"); }, 900);
  var ORDER = ["bounce", "point", "ringer"], next = 0;
  if (btn) {
    btn.hidden = false;
    btn.addEventListener("click", function () {
      if (pitch(ORDER[next])) next = (next + 1) % ORDER.length;
    });
  }
})();
