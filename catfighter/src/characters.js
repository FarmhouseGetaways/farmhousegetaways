/* ==========================================================================
   Super Cat Fighter 6 — roster assembly

   The cats themselves live in `src/cats/<id>.js`, one file each, and register
   on `CF.CatDefs`. This file fixes the order, wires each cat's full move
   table, and publishes `CF.ROSTER`. Add a cat by adding a file and a name to
   ORDER — nothing else.
   ========================================================================== */
(function () {
  var M = CF.Moves;

  var ORDER = ['gracie', 'mario', 'luigi', 'lilly', 'figuro', 'ruby'];
  var ROSTER = ORDER.map(function (id) {
    if (!CF.CatDefs[id]) throw new Error('cat never registered: ' + id);
    return CF.CatDefs[id];
  });

  /* Build the full move table for each character once, at load. */
  ROSTER.forEach(function (c) {
    /* The rig is handed a palette, not a character, so a cat's `look` block —
       which reads far better at the top level of its own file — is carried
       across onto the palette here. */
    if (c.look) c.palette.look = c.look;
    var normals = M.baseNormals(c.mod);
    var throws = M.throwMoves(c.mod);
    var sys = M.systemMoves();
    c.moves = {};
    var k;
    for (k in normals) { normals[k].id = k; c.moves[k] = normals[k]; }
    for (k in throws) { throws[k].id = k; c.moves[k] = throws[k]; }
    for (k in sys) { sys[k].id = k; c.moves[k] = sys[k]; }
    c.specials.forEach(function (s) { s.kind = 'special'; c.moves[s.id] = s; });
    c.supers.forEach(function (s) { s.kind = 'super'; c.moves[s.id] = s; });
  });

  CF.ROSTER = ROSTER;
  CF.byId = function (id) {
    for (var i = 0; i < ROSTER.length; i++) if (ROSTER[i].id === id) return ROSTER[i];
    return ROSTER[0];
  };
})();
