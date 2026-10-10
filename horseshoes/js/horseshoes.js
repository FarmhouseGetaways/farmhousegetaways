/* Hillside Horseshoes: the pitch in the hero, and the scorekeeper. */

/* The pitch. The page is drawn with the shoe already ringing the far stake.
   Only once animation frames are actually running does the shoe leave it and
   fly the dotted arc back onto the stake; a frozen timeline, a background tab
   or reduced motion simply leaves the ringer where it is. The timer below
   lands the shoe regardless, so it is never left hidden mid-air. */
(function () {
  var scene = document.querySelector(".scene");
  if (!scene) return;
  var path = scene.querySelector("#flight");
  var flyer = scene.querySelector("#flyer");
  var btn = document.querySelector(".pitch");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !path || !flyer || !path.getTotalLength) return;

  var busy = false;
  function pitch() {
    if (busy) return;
    busy = true;
    var len = path.getTotalLength(), dur = 1500, t0 = null, done = false;
    var safety = setTimeout(finish, dur + 1500);
    function finish() {
      if (done) return;
      done = true; busy = false;
      clearTimeout(safety);
      flyer.setAttribute("transform", "translate(1083.5 536)");
      scene.classList.remove("throwing", "rang");
      void scene.getBoundingClientRect();
      scene.classList.add("rang");
    }
    function step(ts) {
      if (done) return;
      if (t0 === null) { t0 = ts; scene.classList.remove("rang"); scene.classList.add("throwing"); }
      var k = Math.min(1, (ts - t0) / dur);
      var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      e = 0.35 * k + 0.65 * e; // mostly eased, never stalls at the ends
      var p = path.getPointAtLength(len * e);
      flyer.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ") rotate(" + (e * 720).toFixed(1) + ")");
      if (k < 1) requestAnimationFrame(step); else finish();
    }
    requestAnimationFrame(step);
  }

  setTimeout(pitch, 900);
  if (btn) {
    btn.hidden = false;
    btn.addEventListener("click", pitch);
  }
})();

/* The scorekeeper. Every tap is one entry in a log; the scores are worked out
   from the log, so Undo is just "take the last entry off". The game lives in
   localStorage after every change (wrapped, so private browsing still works,
   just without the memory). The key is namespaced because every micro-site
   shares the farmhousegetaways.com origin. */
(function () {
  var board = document.getElementById("board");
  if (!board) return;
  var KEY = "fg-horseshoes-v1";
  // The pit's four sets of shoes. Each player throws one colour; picking a colour
  // another player has swaps the two, so no two players ever share a set.
  var SHOES = [["white", "White"], ["green", "Green"], ["red", "Red"], ["blue", "Blue"]];
  var TARGETS = [11, 21, 40];
  var $ = function (id) { return document.getElementById(id); };
  var list = $("players"), logEl = $("log"), winBox = $("winner");

  function fresh(keep) {
    return { v: 1, to: keep ? keep.to : 21, n: keep ? keep.n : 2, names: keep ? keep.names.slice() : ["", "", "", ""],
             colors: keep && keep.colors ? keep.colors.slice() : ["white", "green", "red", "blue"], log: [] };
  }
  var state = (function () {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && s.v === 1 && Array.isArray(s.log) && Array.isArray(s.names)) {
        s.to = TARGETS.indexOf(s.to) >= 0 ? s.to : 21;
        s.n = Math.min(4, Math.max(1, s.n | 0));
        while (s.names.length < 4) s.names.push("");
        var ok = Array.isArray(s.colors) && s.colors.length === 4 && SHOES.every(function (c) { return s.colors.indexOf(c[0]) >= 0; });
        if (!ok) s.colors = ["white", "green", "red", "blue"];
        return s;
      }
    } catch (e) { /* no storage: start clean */ }
    return fresh();
  })();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* keep going without it */ }
  }

  function nameOf(i) { return (state.names[i] || "").trim() || "Player " + (i + 1); }
  function scores() {
    var s = [0, 0, 0, 0];
    state.log.forEach(function (e) { if (e.p >= 0 && e.p < 4) s[e.p] += e.pts; });
    return s;
  }
  function winner() {
    // The first player to reach the target, in the order the points were scored.
    var s = [0, 0, 0, 0];
    for (var i = 0; i < state.log.length; i++) {
      var e = state.log[i];
      if (e.p < 0 || e.p >= state.n) continue;
      s[e.p] += e.pts;
      if (s[e.p] >= state.to) return e.p;
    }
    return -1;
  }

  var rows = [];
  function build() {
    list.textContent = "";
    rows = [];
    for (var i = 0; i < state.n; i++) {
      var li = document.createElement("li");
      li.className = "player shoe-" + state.colors[i];

      var tag = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      tag.setAttribute("viewBox", "0 0 100 150");
      tag.setAttribute("class", "p-tag");
      tag.setAttribute("aria-hidden", "true");
      var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", "#rosette");
      tag.appendChild(use);

      var input = document.createElement("input");
      input.className = "p-name";
      input.type = "text";
      input.maxLength = 18;
      input.autocomplete = "off";
      input.placeholder = "Player " + (i + 1);
      input.value = state.names[i] || "";
      input.setAttribute("aria-label", "Name for player or team " + (i + 1));
      (function (idx) {
        input.addEventListener("input", function () { state.names[idx] = this.value; save(); });
      })(i);

      var score = document.createElement("div");
      score.className = "p-score";
      score.setAttribute("aria-hidden", "true");
      var num = document.createElement("span");
      var of = document.createElement("small");
      score.appendChild(num); score.appendChild(of);

      var track = document.createElement("div");
      track.className = "p-track";
      track.setAttribute("aria-hidden", "true");
      var bar = document.createElement("span");
      track.appendChild(bar);

      var btns = document.createElement("div");
      btns.className = "p-btns";
      var r = mk("pill btn-shoe btn-ringer", "+3", "Ringer"), c = mk("pill btn-shoe btn-close", "+1", "Close");
      (function (idx) {
        r.addEventListener("click", function () { add(idx, 3); });
        c.addEventListener("click", function () { add(idx, 1); });
      })(i);
      btns.appendChild(r); btns.appendChild(c);

      var pick = document.createElement("div");
      pick.className = "p-colors";
      pick.setAttribute("role", "group");
      pick.setAttribute("aria-label", "Shoe colour for player " + (i + 1));
      var lbl = document.createElement("span"); lbl.className = "lbl"; lbl.textContent = "Shoes";
      pick.appendChild(lbl);
      var sw = [];
      SHOES.forEach(function (shoe) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "swatch shoe-" + shoe[0];
        b.setAttribute("aria-label", shoe[1] + " shoes");
        b.setAttribute("data-shoe", shoe[0]);
        (function (idx, col) { b.addEventListener("click", function () { choose(idx, col); }); })(i, shoe[0]);
        pick.appendChild(b); sw.push(b);
      });

      li.appendChild(tag); li.appendChild(input); li.appendChild(score); li.appendChild(pick); li.appendChild(track); li.appendChild(btns);
      list.appendChild(li);
      rows.push({ li: li, num: num, of: of, bar: bar, r: r, c: c, input: input, sw: sw });
    }
  }
  function mk(cls, big, small) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    var t = document.createElement("span"); t.textContent = big;
    var s = document.createElement("small"); s.textContent = small;
    b.appendChild(t); b.appendChild(s);
    return b;
  }

  var last = [0, 0, 0, 0];
  function render(bumpIdx) {
    var s = scores(), w = winner(), top = Math.max.apply(null, s.slice(0, state.n));
    rows.forEach(function (row, i) {
      row.li.className = "player shoe-" + state.colors[i] + (top > 0 && s[i] === top && state.n > 1 ? " leading" : "");
      row.sw.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-shoe") === state.colors[i])); });
      row.num.textContent = s[i];
      row.of.textContent = "of " + state.to;
      row.bar.style.width = Math.min(100, (s[i] / state.to) * 100) + "%";
      row.r.disabled = row.c.disabled = w >= 0;
      var who = nameOf(i);
      row.r.setAttribute("aria-label", "Ringer, 3 points for " + who);
      row.c.setAttribute("aria-label", "Close, 1 point for " + who);
      if (i === bumpIdx) {
        row.num.parentNode.classList.remove("bump");
        void row.num.parentNode.offsetWidth;
        row.num.parentNode.classList.add("bump");
      }
    });
    $("undo").disabled = state.log.length === 0;
    if (w >= 0) {
      winBox.hidden = false;
      $("winner-name").textContent = nameOf(w);
      $("winner-line").textContent = "First to " + state.to + ", with " + s[w] + ".";
    } else {
      winBox.hidden = true;
    }
    board.querySelectorAll("[data-to]").forEach(function (b) { b.setAttribute("aria-pressed", String(+b.getAttribute("data-to") === state.to)); });
    board.querySelectorAll("[data-n]").forEach(function (b) { b.setAttribute("aria-pressed", String(+b.getAttribute("data-n") === state.n)); });
    last = s;
  }
  function say(text) { logEl.textContent = text; }
  function shoeName(col) { for (var k = 0; k < SHOES.length; k++) if (SHOES[k][0] === col) return SHOES[k][1]; return col; }
  function choose(i, col) {
    var other = state.colors.indexOf(col);
    if (other === i) return;
    state.colors[other] = state.colors[i];
    state.colors[i] = col;
    save(); render();
    say(nameOf(i) + " throws the " + shoeName(col).toLowerCase() + " shoes" +
        (other < state.n ? ", " + nameOf(other) + " takes the " + shoeName(state.colors[other]).toLowerCase() : "") + ".");
  }
  function standings() {
    var s = scores(), out = [];
    for (var i = 0; i < state.n; i++) out.push(nameOf(i) + " " + s[i]);
    return out.join(", ");
  }

  function add(i, pts) {
    if (winner() >= 0) return;
    state.log.push({ p: i, pts: pts });
    if (state.log.length > 600) state.log.shift();
    save();
    render(i);
    var w = winner();
    if (w >= 0) say(nameOf(w) + " reaches " + state.to + " and takes the blue ribbon.");
    else say((pts === 3 ? "Ringer for " : "One point for ") + nameOf(i) + ". " + standings() + ".");
  }

  $("undo").addEventListener("click", function () {
    var e = state.log.pop();
    if (!e) return;
    save(); render(e.p >= 0 ? e.p : undefined);
    if (e.p < 0) say("Took back the cancelled frame. " + standings() + ".");
    else say("Took back " + (e.pts === 3 ? "a ringer" : "a point") + " for " + nameOf(e.p) + ". " + standings() + ".");
  });

  // New game asks for a second tap instead of a dialog box.
  var armed = null, newBtn = $("new");
  newBtn.addEventListener("click", function () {
    if (!armed) {
      newBtn.classList.add("armed");
      newBtn.textContent = "Tap again to clear";
      armed = setTimeout(disarm, 3500);
      return;
    }
    disarm();
    state = fresh(state);
    save(); render();
    say("New game to " + state.to + ". Good luck, everyone.");
  });
  function disarm() {
    clearTimeout(armed); armed = null;
    newBtn.classList.remove("armed");
    newBtn.textContent = "New game";
  }

  board.querySelectorAll("[data-to]").forEach(function (b) {
    b.addEventListener("click", function () {
      state.to = +b.getAttribute("data-to");
      save(); render();
      say("Playing to " + state.to + ".");
    });
  });
  board.querySelectorAll("[data-n]").forEach(function (b) {
    b.addEventListener("click", function () {
      var n = +b.getAttribute("data-n");
      if (n === state.n) return;
      state.n = n;
      save(); build(); render();
      say(n === 1 ? "One player. Keep your own count." : n + " players or teams.");
    });
  });

  build();
  render();
  board.hidden = false;
})();
