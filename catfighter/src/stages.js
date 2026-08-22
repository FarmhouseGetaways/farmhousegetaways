/* ==========================================================================
   Super Cat Fighter 6 — stage assembly

   Each stage lives in `src/stages/<id>.js` and registers on `CF.StageDefs`.
   This file fixes the order and publishes `CF.Stages`. Add a stage by adding
   a file and a name to ORDER.
   ========================================================================== */
(function () {
  var K = CF.StageKit;
  var ORDER = ['barn', 'pool', 'orchard', 'retreat', 'kitchen', 'porch'];
  var STAGES = ORDER.map(function (id) {
    if (!CF.StageDefs[id]) throw new Error('stage never registered: ' + id);
    return CF.StageDefs[id];
  });
  STAGES.forEach(function (s) { if (s.init) s.init(); });

  CF.Stages = STAGES;
  CF.STAGE = { W: K.W, H: K.H, FLOOR_Y: K.FLOOR_Y };
})();
