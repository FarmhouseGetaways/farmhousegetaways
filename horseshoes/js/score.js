/* The Hillside Horseshoes scorecard, at /horseshoes/score/. One page, three screens: who is playing, the
   round you are on, and the ribbon at the end. Built on the Boulder Oak scorecard's pattern.

   The rules are the ones settled with Cory for the old in-page scorekeeper: one to four players or teams,
   each throwing one of the pit's four colours of shoes (White, Green, Red, Blue), playing to 11, 21 or 40.
   One way to score for any size of game: a ringer is 3, a close shoe is 1, nothing cancels. The first
   player to reach the target, in the order the points were tapped, wins.

   Every tap is one entry in a log, and everything on screen is worked out from it: totals, ringer counts,
   the round number (a "next round" is an entry too, so Undo can take one back), and the winner. The whole
   game lives in localStorage after every tap, so a locked phone, a reload or a closed tab picks up where it
   was. Storage can be missing (private mode), so every read and write is wrapped and the page still works,
   just without the memory. The key is namespaced because every micro-site shares the
   farmhousegetaways.com origin; the old in-page scorekeeper used fg-horseshoes-v1 in a different shape. */
(function () {
  'use strict';

  var KEY = 'fg-horseshoes-score-v1', OLD = 'fg-horseshoes-v1';
  var SHOES = [['white', 'White'], ['green', 'Green'], ['red', 'Red'], ['blue', 'Blue']];
  var GAMES = { 11: 'Short game', 21: 'Backyard game', 40: 'Pro game' };
  var STALE = 12 * 60 * 60 * 1000; // a game nobody has touched in this long is put away on the next visit
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  function blank() {
    return { v: 1, screen: 'setup', to: 21, n: 2, names: ['', '', '', ''], colors: ['white', 'green', 'red', 'blue'], log: [], at: 0 };
  }
  function valid(s) {
    if (!s || s.v !== 1 || !Array.isArray(s.log) || !Array.isArray(s.names)) return null;
    s.to = GAMES[s.to] ? s.to : 21;
    s.n = Math.min(4, Math.max(1, s.n | 0));
    while (s.names.length < 4) s.names.push('');
    var ok = Array.isArray(s.colors) && s.colors.length === 4 && SHOES.every(function (c) { return s.colors.indexOf(c[0]) >= 0; });
    if (!ok) s.colors = ['white', 'green', 'red', 'blue'];
    s.log = s.log.filter(function (e) { return e && (e.next || (e.p >= 0 && e.p < s.n && (e.pts === 1 || e.pts === 3))); });
    return s;
  }
  var state = (function () {
    try {
      var s = valid(JSON.parse(localStorage.getItem(KEY) || 'null'));
      if (s) return s;
      // First visit since the scorecard moved here: bring the names, shoes and target over from the old one.
      var o = JSON.parse(localStorage.getItem(OLD) || 'null');
      if (o && Array.isArray(o.names)) {
        var b = blank();
        b.to = GAMES[o.to] ? o.to : 21;
        b.n = Math.min(4, Math.max(1, o.n | 0));
        b.names = o.names.slice(0, 4).map(function (x) { return String(x || ''); });
        while (b.names.length < 4) b.names.push('');
        if (Array.isArray(o.colors) && o.colors.length === 4 && SHOES.every(function (c) { return o.colors.indexOf(c[0]) >= 0; })) b.colors = o.colors.slice();
        return b;
      }
    } catch (e) { /* no storage: start clean */ }
    return blank();
  })();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* keep going without it */ }
  }
  function touch() { state.at = Date.now(); }

  /* ---------- Worked out from the log ---------- */
  var nameOf = function (i) { return (state.names[i] || '').trim() || 'Player ' + (i + 1); };
  var shoeName = function (col) { for (var k = 0; k < SHOES.length; k++) if (SHOES[k][0] === col) return SHOES[k][1]; return col; };
  function round() {
    var r = 1;
    state.log.forEach(function (e) { if (e.next) r++; });
    return r;
  }
  function tally() {
    var P = [], r = 1;
    for (var i = 0; i < state.n; i++) P.push({ i: i, tot: 0, ringers: 0, close: 0, now: 0 });
    var cur = round();
    state.log.forEach(function (e) {
      if (e.next) { r++; return; }
      var p = P[e.p];
      if (!p) return;
      p.tot += e.pts;
      if (e.pts === 3) p.ringers++; else p.close++;
      if (r === cur) p.now += e.pts;
    });
    return P;
  }
  function winner() {
    // The first player to reach the target, in the order the points were scored.
    var s = [0, 0, 0, 0], r = 1;
    for (var k = 0; k < state.log.length; k++) {
      var e = state.log[k];
      if (e.next) { r++; continue; }
      if (e.p < 0 || e.p >= state.n) continue;
      s[e.p] += e.pts;
      if (s[e.p] >= state.to) return { p: e.p, round: r };
    }
    return null;
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  /* ---------- Screens ---------- */
  function show(screen) {
    state.screen = screen;
    ['setup', 'play', 'done'].forEach(function (s) { $(s).hidden = s !== screen; });
    save();
    if (screen === 'setup') renderSetup();
    if (screen === 'play') buildPlay();
    if (screen === 'done') renderDone();
    window.scrollTo(0, 0);
  }

  /* ---------- 1. Who is playing ---------- */
  function chip(col) {
    return '<span class="chip shoe-' + col + '" aria-hidden="true"><svg viewBox="0 0 32 32"><use href="#lucky"/></svg></span>';
  }
  function renderSetup() {
    var html = '';
    for (var i = 0; i < state.n; i++) {
      var col = state.colors[i];
      html += '<li class="ro shoe-' + col + '">' + chip(col) +
        '<input type="text" data-i="' + i + '" value="' + esc(state.names[i]) + '" placeholder="Player ' + (i + 1) + '" maxlength="18" autocomplete="off" autocapitalize="words" aria-label="Name for player or team ' + (i + 1) + '">' +
        (state.n > 1 ? '<button type="button" class="remove" data-remove="' + i + '" aria-label="Remove ' + esc(nameOf(i)) + '">&times;</button>' : '<span></span>') +
        '<div class="ro-colors" role="group" aria-label="Shoe color for ' + esc(nameOf(i)) + '"><span class="lbl">Shoes</span>' +
        SHOES.map(function (s) {
          var taken = state.colors.indexOf(s[0]);
          return '<button type="button" class="swatch shoe-' + s[0] + '" data-i="' + i + '" data-shoe="' + s[0] + '" aria-pressed="' + (s[0] === col) + '" aria-label="' + s[1] + ' shoes' +
            (taken !== i && taken < state.n ? ', now with ' + esc(nameOf(taken)) : '') + '"></button>';
        }).join('') + '</div></li>';
    }
    $('roster').innerHTML = html;
    $('add-player').hidden = state.n >= 4;
    document.querySelectorAll('.game').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-to') === state.to)); });
    $('start').textContent = state.log.length ? 'Back to the game' : 'Start the game';
  }
  $('roster').addEventListener('input', function (e) {
    var t = e.target;
    if (t.tagName !== 'INPUT') return;
    state.names[+t.getAttribute('data-i')] = t.value;
    save();
  });
  $('roster').addEventListener('click', function (e) {
    var sw = e.target.closest('.swatch');
    if (sw) {
      // Each colour is one set of shoes. Picking a colour somebody else has swaps the two.
      var i = +sw.getAttribute('data-i'), col = sw.getAttribute('data-shoe'), other = state.colors.indexOf(col);
      if (other === i) return;
      state.colors[other] = state.colors[i];
      state.colors[i] = col;
      save(); renderSetup();
      var again = $('roster').querySelector('.swatch[data-i="' + i + '"][data-shoe="' + col + '"]');
      if (again) again.focus();
      return;
    }
    var rm = e.target.closest('[data-remove]');
    if (!rm || state.n <= 1) return;
    var k = +rm.getAttribute('data-remove');
    // Their points go with them, and everyone after them moves up one.
    state.log = state.log.filter(function (x) { return x.next || x.p !== k; }).map(function (x) {
      return x.next || x.p < k ? x : { p: x.p - 1, pts: x.pts };
    });
    state.names.push(state.names.splice(k, 1)[0]);
    state.colors.push(state.colors.splice(k, 1)[0]);
    state.names[3] = '';
    state.n--;
    save(); renderSetup();
  });
  $('add-player').addEventListener('click', function () {
    if (state.n >= 4) return;
    state.names[state.n] = '';
    state.n++;
    save(); renderSetup();
    var ins = $('roster').querySelectorAll('input');
    ins[ins.length - 1].focus();
  });
  document.querySelectorAll('.game').forEach(function (b) {
    b.addEventListener('click', function () { state.to = +b.getAttribute('data-to'); save(); renderSetup(); });
  });
  $('start').addEventListener('click', function () {
    touch();
    show(winner() ? 'done' : 'play');
  });

  /* ---------- 2. The round ---------- */
  var cards = [];
  function buildPlay() {
    var html = '';
    for (var i = 0; i < state.n; i++) {
      var col = state.colors[i], who = esc(nameOf(i));
      html += '<li class="pc shoe-' + col + '">' +
        '<div class="pc-head">' + chip(col) +
          '<div class="pc-who"><b>' + who + '</b><span class="pc-meta"></span></div>' +
          '<div class="pc-total" aria-hidden="true"><span class="pc-num">0</span><small class="pc-go"></small></div>' +
        '</div>' +
        '<div class="pc-track" aria-hidden="true"><span></span></div>' +
        '<div class="pc-btns">' +
          '<button type="button" class="pc-minus" data-i="' + i + '" aria-label="Take back ' + who + '&rsquo;s last tap this round">&minus;</button>' +
          '<button type="button" class="pill pc-ringer" data-i="' + i + '" data-pts="3" aria-label="Ringer, 3 points for ' + who + '"><b>+3</b><small>Ringer</small></button>' +
          '<button type="button" class="pill pc-close" data-i="' + i + '" data-pts="1" aria-label="Close, 1 point for ' + who + '"><b>+1</b><small>Close</small></button>' +
        '</div></li>';
    }
    $('cards').innerHTML = html;
    cards = Array.prototype.map.call($('cards').children, function (li) {
      return { li: li, num: li.querySelector('.pc-num'), go: li.querySelector('.pc-go'), meta: li.querySelector('.pc-meta'),
        bar: li.querySelector('.pc-track span'), minus: li.querySelector('.pc-minus'), total: li.querySelector('.pc-total') };
    });
    $('board-target').textContent = state.to;
    $('board-game').textContent = GAMES[state.to];
    $('say').textContent = '';
    update();
  }
  function hop(el) {
    if (reduce || !el) return;
    el.classList.remove('hop');
    void el.offsetWidth;
    el.classList.add('hop');
  }
  var finishing = 0;
  function update(bump) {
    var P = tally(), r = round(), n = state.n;
    var top = Math.max.apply(null, P.map(function (p) { return p.tot; }));
    var leaders = P.filter(function (p) { return p.tot === top; });
    P.forEach(function (p, i) {
      var c = cards[i];
      if (!c) return;
      var left = Math.max(0, state.to - p.tot);
      c.li.classList.toggle('leading', n > 1 && top > 0 && p.tot === top);
      c.num.textContent = p.tot;
      c.go.textContent = left ? left + ' to go' : 'Done!';
      c.meta.textContent = (p.now ? '+' + p.now + ' this round' : 'Nothing yet this round') + (p.ringers ? ' · ' + plural(p.ringers, 'ringer', 'ringers') : '');
      c.bar.style.width = Math.min(100, p.tot / state.to * 100) + '%';
      c.minus.disabled = !p.now || !!finishing;
      if (i === bump) hop(c.total);
    });
    $('round-h').textContent = r;
    var lead;
    if (n === 1) lead = top ? (state.to - top) + ' to go.' : 'Tap as each shoe is settled.';
    else if (!top) lead = 'Everyone starts at zero. Good luck!';
    else if (leaders.length > 1) lead = leaders.map(function (p) { return nameOf(p.i); }).join(' and ') + ' are tied at ' + top + '. ' + (state.to - top) + ' to go.';
    else {
      var second = Math.max.apply(null, P.filter(function (p) { return p !== leaders[0]; }).map(function (p) { return p.tot; }));
      lead = nameOf(leaders[0].i) + ' leads by ' + (top - second) + '. ' + Math.max(0, state.to - top) + ' to go.';
    }
    $('lead').textContent = lead;
    $('undo').disabled = !state.log.length || !!finishing;
    $('next').disabled = !!finishing;
    document.querySelectorAll('.pc-ringer, .pc-close').forEach(function (b) { b.disabled = !!finishing; });
  }
  function say(t) { $('say').textContent = t; }
  function standingsLine() {
    return tally().map(function (p) { return nameOf(p.i) + ' ' + p.tot; }).join(', ');
  }

  $('cards').addEventListener('click', function (e) {
    if (finishing) return;
    var b = e.target.closest('[data-pts]');
    if (b) {
      var i = +b.getAttribute('data-i'), pts = +b.getAttribute('data-pts');
      state.log.push({ p: i, pts: pts });
      if (state.log.length > 2000) state.log.shift();
      touch(); save();
      var w = winner();
      if (w) {
        // Let the last score land on its card for a moment, then hand out the ribbon.
        finishing = setTimeout(function () { finishing = 0; show('done'); }, reduce ? 150 : 700);
        update(i);
        say(nameOf(w.p) + ' reaches ' + state.to + '!');
        return;
      }
      update(i);
      say((pts === 3 ? 'Ringer for ' : 'One point for ') + nameOf(i) + '. ' + standingsLine() + '.');
      return;
    }
    var m = e.target.closest('.pc-minus');
    if (m) {
      // Take back this player's last tap in this round only, so an old round is never touched by accident.
      var k = +m.getAttribute('data-i');
      for (var x = state.log.length - 1; x >= 0; x--) {
        if (state.log[x].next) break;
        if (state.log[x].p === k) {
          var gone = state.log.splice(x, 1)[0];
          touch(); save(); update(k);
          say('Took back ' + (gone.pts === 3 ? 'a ringer' : 'a point') + ' for ' + nameOf(k) + '. ' + standingsLine() + '.');
          return;
        }
      }
    }
  });
  function undo() {
    var e = state.log.pop();
    if (!e) return null;
    touch(); save();
    return e;
  }
  $('undo').addEventListener('click', function () {
    if (finishing) return;
    var e = undo();
    if (!e) return;
    update(e.next ? undefined : e.p);
    if (e.next) { hop($('round-h')); say('Back to round ' + round() + '.'); }
    else say('Took back ' + (e.pts === 3 ? 'a ringer' : 'a point') + ' for ' + nameOf(e.p) + '. ' + standingsLine() + '.');
  });
  $('next').addEventListener('click', function () {
    if (finishing) return;
    state.log.push({ next: 1 });
    touch(); save(); update();
    hop($('round-h'));
    say('Round ' + round() + '. ' + standingsLine() + '.');
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
  $('to-setup').addEventListener('click', function () { show('setup'); });

  /* ---------- 3. Finished ---------- */
  function renderDone() {
    var w = winner();
    if (!w) return show(state.log.length ? 'play' : 'setup');
    var P = tally();
    var sorted = P.slice().sort(function (a, b) {
      return (b.i === w.p) - (a.i === w.p) || b.tot - a.tot || b.ringers - a.ringers || a.i - b.i;
    });
    $('win').className = 'win shoe-' + state.colors[w.p];
    $('done-h').textContent = nameOf(w.p);
    $('done-sub').textContent = 'First to ' + state.to + ', with ' + P[w.p].tot + ', in ' + plural(w.round, 'round', 'rounds') + '.';
    var place = 0, prev = null;
    $('standings').innerHTML = sorted.map(function (p, k) {
      if (k === 0 || p.tot !== prev) place = k + 1;
      prev = p.tot;
      var col = state.colors[p.i];
      return '<li class="st shoe-' + col + (k === 0 ? ' first' : '') + '"><span class="place">' + place + '</span>' + chip(col) +
        '<div class="who"><b>' + esc(nameOf(p.i)) + '</b><span>' + plural(p.ringers, 'ringer', 'ringers') + ' · ' + plural(p.close, 'close shoe', 'close shoes') + '</span></div>' +
        '<div class="tot">' + p.tot + '<small>points</small></div></li>';
    }).join('');
    hop(document.querySelector('.win-rosette'));
  }
  $('again').addEventListener('click', function () {
    // Same players, same shoes, same target, a clean slate.
    state.log = []; touch();
    show('play');
    say('New game to ' + state.to + '. Good luck, everyone.');
  });
  $('undo-win').addEventListener('click', function () {
    var e = undo();
    show(winner() ? 'done' : 'play');
    if (e && !e.next) say('Took back ' + (e.pts === 3 ? 'a ringer' : 'a point') + ' for ' + nameOf(e.p) + '. ' + standingsLine() + '.');
  });
  /* New game asks for a second tap instead of a dialog box, and keeps the names and shoes to edit. */
  var armed = 0;
  $('new-game').addEventListener('click', function () {
    var b = this;
    if (!armed) {
      b.textContent = 'Tap again to clear'; b.classList.add('armed');
      armed = setTimeout(function () { armed = 0; b.textContent = 'New game'; b.classList.remove('armed'); }, 3500);
      return;
    }
    clearTimeout(armed); armed = 0; b.textContent = 'New game'; b.classList.remove('armed');
    state.log = []; touch();
    show('setup');
  });

  /* ---------- Start up ---------- */
  if (state.at && Date.now() - state.at > STALE && (state.log.length || state.screen !== 'setup')) {
    // Left from another day: put the old game away, keep the names to edit.
    state.log = []; state.screen = 'setup';
  }
  var first = state.screen;
  if (first === 'done' && !winner()) first = state.log.length ? 'play' : 'setup';
  if (first === 'play' && winner()) first = 'done';
  if (first !== 'setup' && first !== 'play' && first !== 'done') first = 'setup';
  show(first);
})();
