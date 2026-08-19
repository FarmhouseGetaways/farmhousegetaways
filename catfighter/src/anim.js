/* ==========================================================================
   Cat Fighter II — pose library and keyframe blending

   Every pose is nine numbers-ish. Moves reference poses by name and give the
   frame each pose is reached on; the tween in between is done here. Frame
   data (startup / active / recovery) is authoritative — the animation is
   fitted to it, never the other way round.
   ========================================================================== */
(function () {
  var U = CF.util;

  var BASE = {
    px: 0, py: 42, torso: 6,
    head: [3, 15, 0],
    armF: [40, 95], armB: [25, 100],
    legF: [14, -14], legB: [-8, 6],
    tail: [240, -35, -32],
    tailFront: 0,     /* >0.5 draws the tail over the body — see rig.js */
    tailLen: 1        /* stretches the tail, for a whip that has to reach */
  };

  function P(o) { return U.deepMerge(BASE, o || {}); }

  var L = {};   /* the library */

  /* ---- stance -------------------------------------------------------------

     A fighting stance, not a standing cat: centre of gravity dropped, both
     knees bent, a wide base, the lead paw out and the rear paw tucked by the
     chin. Standing upright on straight legs is most of what made these read
     as dolls rather than fighters.                                        */

  L.stand  = P({ py: 40, torso: 10, head: [4, 14.6, 2],
                 legF: [26, -30], legB: [-22, 26],
                 armF: [48, 100], armB: [32, 116] });
  L.standB = P({ py: 41.4, torso: 8, head: [4, 15.2, 0],
                 legF: [23, -27], legB: [-19, 23],
                 armF: [44, 96], armB: [29, 112], tail: [244, -39.2, -41.6] });
  L.standC = P({ py: 39, torso: 12, head: [4, 14.2, 4],
                 legF: [29, -33], legB: [-25, 29],
                 armF: [51, 104], armB: [35, 120], tail: [236, -30.8, -22.4] });

  L.walkF1 = P({ py: 39, torso: 12, legF: [40, -40], legB: [-30, 32], armF: [40, 94], armB: [38, 104], tail: [246, -42, -28.8] });
  L.walkF2 = P({ py: 41, torso: 9,  legF: [16, -20], legB: [-10, 14], armF: [48, 100], armB: [30, 114] });
  L.walkF3 = P({ py: 39, torso: 10, legF: [-14, 16], legB: [38, -34], armF: [54, 106], armB: [24, 108], tail: [234, -28, -35.2] });
  L.walkF4 = P({ py: 41, torso: 10, legF: [16, -20], legB: [-10, 14], armF: [46, 98], armB: [32, 116] });

  L.walkB1 = P({ py: 39, torso: 6, legF: [-12, 16], legB: [34, -30], armF: [44, 102], armB: [34, 120], tail: [230, -19.6, -16] });
  L.walkB2 = P({ py: 41, torso: 8, legF: [18, -22], legB: [-12, 16], armF: [47, 100], armB: [32, 116] });
  L.walkB3 = P({ py: 39, torso: 8, legF: [34, -34], legB: [-26, 28], armF: [50, 104], armB: [30, 112], tail: [226, -14, -12.8] });
  L.walkB4 = P({ py: 41, torso: 9, legF: [18, -22], legB: [-12, 16], armF: [46, 98], armB: [32, 116] });

  L.crouch = P({ py: 22, torso: 20, head: [4, 13, 4],
                 legF: [62, -118], legB: [-46, 104],
                 armF: [52, 84], armB: [34, 92], tail: [216, -8.4, 6.4] });
  L.crouchDeep = P({ py: 19, torso: 24, head: [5, 12.5, 6],
                 legF: [66, -124], legB: [-50, 110],
                 armF: [56, 82], armB: [36, 90], tail: [212, -5.6, 9.6] });

  L.jumpRise = P({ py: 40, torso: 14, head: [4, 14, 4],
                   legF: [58, -96], legB: [-30, 82],
                   armF: [96, 46], armB: [70, 60], tail: [208, 11.2, 25.6] });
  L.jumpApex = P({ py: 38, torso: 10, head: [4, 14, 2],
                   legF: [50, -104], legB: [-24, 88],
                   armF: [110, 30], armB: [82, 44], tail: [200, 19.6, 35.2] });
  L.jumpFall = P({ py: 41, torso: 4, head: [3, 15, -2],
                   legF: [30, -60], legB: [-18, 46],
                   armF: [82, 56], armB: [58, 70], tail: [226, -8.4, 6.4] });
  L.land = P({ py: 26, torso: 18, head: [4, 13, 3],
               legF: [52, -100], legB: [-40, 90],
               armF: [64, 70], armB: [44, 80], tail: [220, -11.2, 0] });

  /* ---- guard ------------------------------------------------------------ */
  L.guardHigh = P({ py: 38, torso: -2, head: [1, 14.6, -4],
                    armF: [14, 134], armB: [6, 138],
                    legF: [24, -28], legB: [-26, 30], tail: [218, -8.4, -6.4] });
  L.guardLow = P({ py: 22, torso: 10, head: [2, 13, -2],
                   armF: [24, 122], armB: [16, 126],
                   legF: [62, -118], legB: [-46, 104], tail: [212, -5.6, 3.2] });
  L.guardAir = P({ py: 40, torso: 0, head: [1, 15, -3],
                   armF: [22, 126], armB: [14, 130],
                   legF: [44, -88], legB: [-20, 74], tail: [210, 5.6, 16] });

  /* ---- being hit -------------------------------------------------------- */
  L.hitHigh = P({ py: 41, torso: -18, head: [-3, 15, -22],
                  armF: [-20, 40], armB: [-30, 34],
                  legF: [4, -6], legB: [-20, 16], tail: [206, 8.4, 19.2] });
  L.hitBody = P({ py: 39, torso: -10, head: [0, 14, -12],
                  armF: [10, 60], armB: [0, 56],
                  legF: [16, -18], legB: [-24, 20], tail: [214, 0, 12.8] });
  L.hitLow = P({ py: 21, torso: -6, head: [0, 13, -14],
                 armF: [4, 62], armB: [-6, 58],
                 legF: [60, -114], legB: [-44, 100], tail: [210, 2.8, 12.8] });
  L.hitHeavy = P({ py: 42, torso: -30, head: [-6, 15, -34],
                   armF: [-38, 26], armB: [-48, 20],
                   legF: [-6, 4], legB: [-28, 22], tail: [198, 19.6, 32] });

  L.launch = P({ py: 44, torso: -46, head: [-8, 15, -48],
                 armF: [-60, 18], armB: [-72, 12],
                 legF: [-26, 30], legB: [-44, 44], tail: [188, 30.8, 44.8] });
  L.downed = P({ py: 12, torso: -80, head: [-14, 12, -84],
                 armF: [-88, 10], armB: [-96, 8],
                 legF: [-72, 62], legB: [-84, 70], tail: [160, 42, 48] });
  L.wakeup = P({ py: 30, torso: -24, head: [-2, 14, -20],
                 armF: [-20, 70], armB: [-30, 66],
                 legF: [48, -92], legB: [-38, 84], tail: [206, 2.8, 9.6] });

  L.dizzy1 = P({ py: 40, torso: -8, head: [-2, 15, -10], armF: [-16, 44], armB: [-24, 40],
                 legF: [18, -22], legB: [-16, 14], tail: [216, -5.6, -3.2] });
  L.dizzy2 = P({ py: 40, torso: 10, head: [4, 15, 10], armF: [-10, 50], armB: [-18, 46],
                 legF: [-12, 16], legB: [20, -18], tail: [230, -19.6, -16] });

  /* ---- punches ---------------------------------------------------------- */
  L.jabWind    = P({ torso: 4, armF: [58, 118], armB: [22, 104] });
  L.jab        = P({ torso: 10, px: 1, armF: [92, 4], armB: [18, 108], head: [3, 15, 2] });
  L.strongWind = P({ torso: -2, armF: [30, 140], armB: [20, 100], py: 42 });
  L.strong     = P({ torso: 14, px: 2, armF: [95, 2], armB: [10, 116], head: [4, 15, 3],
                     legF: [22, -22], legB: [-14, 12] });
  L.fierceWind = P({ torso: -12, px: -2, armF: [8, 152], armB: [26, 96], py: 43,
                     legF: [4, -6], legB: [-18, 16] });
  L.fierce     = P({ torso: 20, px: 4, armF: [98, 0], armB: [4, 124], head: [5, 15, 5],
                     legF: [34, -34], legB: [-24, 22], tail: [246, -47.6, -38.4] });

  L.uppercutWind = P({ py: 34, torso: 16, armF: [24, 60], armB: [24, 100],
                       legF: [40, -74], legB: [-30, 62] });
  L.uppercut     = P({ py: 46, torso: -14, px: 2, armF: [166, -6], armB: [8, 110],
                       head: [2, 15, -8], legF: [10, -14], legB: [-16, 10] });

  L.lowJab   = P(U.deepMerge(L.crouch, { armF: [88, 2], torso: 22, px: 1 }));
  L.lowStrong= P(U.deepMerge(L.crouch, { armF: [96, -4], torso: 26, px: 2, py: 20 }));
  L.lowFierce= P(U.deepMerge(L.crouch, { armF: [140, -18], torso: 8, py: 27, px: 1 }));

  /* ---- kicks ------------------------------------------------------------ */
  L.lkWind = P({ py: 43, legF: [26, -40], legB: [-8, 8], torso: 4, armF: [34, 100] });
  L.lk     = P({ py: 43, legF: [78, -22], legB: [-10, 10], torso: -6, px: 1,
                 armF: [26, 106], armB: [40, 90], tail: [240, -42, -38.4] });
  L.mkWind = P({ py: 42, legF: [30, -56], legB: [-10, 10], torso: 2, armF: [30, 104] });
  L.mk     = P({ py: 44, legF: [96, -14], legB: [-12, 12], torso: -14, px: 2,
                 armF: [18, 110], armB: [48, 84], head: [1, 15, -6], tail: [246, -50.4, -41.6] });
  L.hkWind = P({ py: 40, legF: [-14, 24], legB: [-18, 18], torso: -8, armF: [22, 112],
                 tail: [220, -11.2, -6.4] });
  L.hk     = P({ py: 46, legF: [126, -18], legB: [-16, 14], torso: -26, px: 3,
                 armF: [6, 120], armB: [60, 72], head: [-1, 15, -12], tail: [254, -61.6, -48] });

  L.lowKick  = P(U.deepMerge(L.crouch, { legF: [96, -84], py: 21, torso: 16 }));
  L.sweepWind= P(U.deepMerge(L.crouch, { legF: [40, -100], py: 20, torso: 22 }));
  L.sweep    = P(U.deepMerge(L.crouch, { legF: [104, -96], legB: [-56, 118],
                 py: 15, torso: 30, armF: [76, 40], armB: [40, 84] }));

  L.jumpPunch = P(U.deepMerge(L.jumpFall, { armF: [128, -18], torso: 12, head: [4, 15, 6] }));
  L.jumpKick  = P(U.deepMerge(L.jumpFall, { legF: [104, -22], torso: -8, px: 2,
                  armF: [56, 74], head: [1, 15, -6] }));
  L.jumpHeavy = P(U.deepMerge(L.jumpFall, { legF: [118, -8], legB: [-10, 20], torso: -16,
                  armF: [30, 96], armB: [70, 60], head: [0, 15, -10] }));

  /* ---- throws ----------------------------------------------------------- */
  L.throwReach = P({ torso: 8, px: 2, armF: [86, 12], armB: [80, 16], head: [4, 15, 2] });
  L.throwHold  = P({ torso: -6, py: 44, armF: [130, -30], armB: [126, -26], head: [2, 15, -6],
                     legF: [16, -18], legB: [-18, 16] });
  L.thrown     = P({ py: 30, torso: -70, head: [-12, 13, -74], armF: [-80, 14], armB: [-88, 10],
                     legF: [-50, 50], legB: [-62, 58], tail: [170, 36.4, 41.6] });

  /* ---- specials --------------------------------------------------------- */
  L.fireWind    = P({ py: 40, torso: -14, px: -3, armF: [-18, 96], armB: [-26, 100],
                      head: [1, 15, -6], legF: [8, -12], legB: [-22, 20] });
  L.fireRelease = P({ py: 41, torso: 16, px: 3, armF: [88, 8], armB: [78, 14],
                      head: [5, 15, 4], legF: [30, -32], legB: [-20, 18] });

  L.dpWind = P({ py: 30, torso: 20, armF: [10, 70], armB: [20, 96],
                 legF: [52, -96], legB: [-34, 74] });
  L.dpRise = P({ py: 52, torso: -8, px: 2, armF: [172, -10], armB: [40, 86],
                 head: [2, 16, -10], legF: [46, -76], legB: [-8, 34], tail: [190, 28, 38.4] });
  L.dpFall = P({ py: 46, torso: 6, armF: [150, 10], armB: [30, 92],
                 legF: [36, -60], legB: [-14, 40], tail: [206, 11.2, 22.4] });

  L.spinWind = P({ py: 41, torso: -16, armF: [-10, 120], armB: [-18, 116], legF: [-16, 22], legB: [-20, 18] });
  L.spinA    = P({ py: 44, torso: -20, legF: [120, -20], legB: [-30, 26], armF: [-24, 96], armB: [92, 30] });
  L.spinB    = P({ py: 44, torso: 20, legF: [-30, 26], legB: [120, -20], armF: [92, 30], armB: [-24, 96] });

  L.chargeWind = P({ py: 38, torso: 22, armF: [-4, 60], armB: [-10, 56],
                     legF: [46, -84], legB: [-36, 76], head: [5, 14, 8] });
  L.chargeGo   = P({ py: 34, torso: 44, px: 4, armF: [-40, 40], armB: [-48, 36],
                     head: [8, 13, 22], legF: [70, -110], legB: [-50, 96], tail: [260, -70, -48] });

  L.stretchPunch = P({ torso: 12, px: 2, armF: [92, -2], armB: [10, 110], head: [4, 15, 4] });
  L.stretchKick  = P({ py: 44, legF: [98, -8], legB: [-14, 14], torso: -18, px: 2,
                       armF: [14, 112], armB: [54, 78] });

  L.teleport = P({ py: 46, torso: 0, armF: [176, 0], armB: [176, 0], head: [2, 16, 0],
                   legF: [10, -12], legB: [-10, 12], tail: [220, 0, 0] });

  L.grabWind = P({ py: 38, torso: 16, armF: [70, 40], armB: [64, 44], head: [5, 14, 6],
                   legF: [40, -74], legB: [-32, 66] });
  L.grabSpin = P({ py: 46, torso: -10, armF: [150, -40], armB: [146, -36], head: [1, 16, -8],
                   legF: [20, -28], legB: [-24, 22] });

  L.tauntPose = P({ py: 43, torso: -6, armF: [-30, 150], armB: [30, 110], head: [2, 16, -6],
                    legF: [8, -10], legB: [-12, 10], tail: [216, -2.8, 12.8] });
  L.winPose   = P({ py: 43, torso: -4, armF: [168, -12], armB: [30, 104], head: [3, 16, -4],
                    legF: [12, -14], legB: [-14, 12], tail: [202, 16.8, 28.8] });
  L.koPose    = P({ py: 10, torso: -86, head: [-16, 11, -90], armF: [-92, 6], armB: [-100, 4],
                    legF: [-78, 66], legB: [-90, 74], tail: [156, 44.8, 51.2] });

  /* ---- Gracie: the growl and the tail whip --------------------------------

     The growl is drawn from the chest — she sinks, gathers, then throws her
     head forward with her mouth open. The tail whip coils the tail hard back
     and then snaps it through, and sets `tailFront` so the tail passes over
     the body instead of hiding behind it.                                  */

  L.growlWind = P({ py: 36, torso: 22, head: [6, 13.5, 12],
                    armF: [22, 74], armB: [16, 80],
                    legF: [52, -90], legB: [-40, 80],
                    tail: [272, -48, -36] });
  L.growlOut  = P({ py: 42, torso: 6, px: 2, head: [9, 15, 2],
                    armF: [66, 42], armB: [54, 50],
                    legF: [28, -32], legB: [-30, 26],
                    tail: [238, -34, -52] });
  L.growlHold = P({ py: 41, torso: 9, px: 1, head: [8, 15, 4],
                    armF: [60, 50], armB: [50, 56],
                    legF: [24, -28], legB: [-26, 22],
                    tail: [244, -38, -46] });

  L.whipWind = P({ py: 40, torso: -14, head: [0, 15, -10],
                   armF: [26, 112], armB: [18, 116],
                   legF: [8, -10], legB: [-20, 18],
                   tail: [292, -58, -42] });
  L.whipMid  = P({ py: 35, torso: 8, px: 1, head: [4, 14, 6],
                   armF: [48, 86], armB: [40, 92],
                   legF: [38, -58], legB: [-32, 50],
                   tail: [124, -20, -10], tailFront: 1, tailLen: 1.7 });
  L.whipOut  = P({ py: 31, torso: 18, px: 3, head: [6, 13, 10],
                   armF: [60, 66], armB: [50, 72],
                   legF: [52, -80], legB: [-40, 68],
                   tail: [78, 4, 6], tailFront: 1, tailLen: 2.5 });
  L.whipEnd  = P({ py: 37, torso: 4, px: 1, head: [3, 14.5, 2],
                   armF: [42, 94], armB: [34, 98],
                   legF: [24, -28], legB: [-24, 22],
                   tail: [166, -18, -12], tailFront: 1, tailLen: 1.3 });

  /* ---- Mario: the belly bump and the smother ------------------------------ */

  L.bellyWind = P({ py: 37, torso: -18, px: -3, head: [-1, 14, -12],
                    armF: [-16, 84], armB: [-24, 88],
                    legF: [26, -44], legB: [-34, 56], tail: [268, -42, -30] });
  L.bellyHit  = P({ py: 34, torso: 30, px: 6, head: [8, 13, 18],
                    armF: [-44, 52], armB: [-52, 46],
                    legF: [60, -92], legB: [-42, 74], tail: [212, -18, -14] });
  L.bellyEnd  = P({ py: 38, torso: 10, px: 2, head: [5, 14, 6],
                    armF: [10, 78], armB: [2, 82],
                    legF: [34, -48], legB: [-30, 44], tail: [232, -28, -22] });

  L.smotherWind = P({ py: 44, torso: -22, head: [-2, 16, -14],
                      armF: [-58, 40], armB: [-66, 36],
                      legF: [4, -8], legB: [-16, 14], tail: [280, -50, -34] });
  L.smotherDrop = P({ py: 16, torso: 46, px: 6, head: [11, 10, 34],
                      armF: [92, 10], armB: [84, 16],
                      legF: [82, -140], legB: [-58, 128], tail: [196, -8, -6] });

  /* ---- Luigi: the flying body attack and the leg sweep -------------------- */

  L.flyWind = P({ py: 30, torso: 16, head: [4, 13, 8],
                  armF: [18, 96], armB: [10, 100],
                  legF: [54, -96], legB: [-42, 86], tail: [274, -44, -32] });
  L.flyBody = P({ py: 42, torso: 74, px: 4, head: [14, 13, 46],
                  armF: [116, -18], armB: [104, -10],
                  legF: [-64, 34], legB: [-78, 40], tail: [176, -6, -4] });
  L.flyLand = P({ py: 26, torso: 16, px: 2, head: [5, 13, 8],
                  armF: [48, 74], armB: [40, 80],
                  legF: [56, -104], legB: [-44, 94], tail: [222, -24, -18] });

  L.sweepWindL = P({ py: 24, torso: 20, head: [4, 13, 8],
                     armF: [58, 70], armB: [46, 78],
                     legF: [38, -92], legB: [-46, 104], tail: [258, -36, -26] });
  L.sweepLow   = P({ py: 13, torso: 34, px: 3, head: [7, 11, 20],
                     armF: [82, 34], armB: [66, 46],
                     legF: [116, -104], legB: [-60, 124], tail: [204, -14, -10] });

  /* ---- Lilly: the flip attack and the crane kick -------------------------- */

  L.flipWind = P({ py: 27, torso: 22, head: [5, 13, 10],
                   armF: [16, 92], armB: [8, 98],
                   legF: [58, -104], legB: [-46, 94], tail: [270, -40, -28] });
  L.flipUp   = P({ py: 46, torso: -70, px: -1, head: [-10, 14, -66],
                   armF: [-84, 30], armB: [-92, 26],
                   legF: [-40, 96], legB: [-58, 104], tail: [150, 14, 18] });
  L.flipOver = P({ py: 44, torso: -150, px: -3, head: [-14, 13, -148],
                   armF: [-140, 20], armB: [-148, 16],
                   legF: [-96, 70], legB: [-112, 78], tail: [110, 26, 26] });
  L.flipDown = P({ py: 34, torso: -18, head: [-2, 14, -14],
                   armF: [-24, 66], armB: [-32, 62],
                   legF: [44, -76], legB: [-34, 66], tail: [214, -20, -14] });

  L.craneUp   = P({ py: 44, torso: -6, head: [1, 16, -4],
                    armF: [-38, 120], armB: [-46, 116],
                    legF: [72, -128], legB: [-8, 8], tail: [188, -8, 6] });
  L.craneKick = P({ py: 47, torso: -22, px: 3, head: [-2, 16, -16],
                    armF: [-58, 96], armB: [-66, 92],
                    legF: [126, -12], legB: [-14, 10], tail: [172, 4, 14] });

  /* ---- Figuro: back-leg boxing and the retreat ---------------------------- */

  L.boxStance = P({ py: 46, torso: -14, head: [0, 16, -10],
                    armF: [24, 118], armB: [16, 122],
                    legF: [6, -8], legB: [-14, 12], tail: [214, -20, -16] });
  L.boxA      = P({ py: 46, torso: -6, px: 1, head: [2, 16, -6],
                    armF: [92, 6], armB: [14, 124],
                    legF: [8, -10], legB: [-14, 12], tail: [220, -24, -18] });
  L.boxB      = P({ py: 46, torso: -10, px: 1, head: [1, 16, -8],
                    armF: [20, 120], armB: [88, 10],
                    legF: [6, -8], legB: [-16, 14], tail: [208, -18, -14] });

  L.retreatWind = P({ py: 34, torso: 18, head: [5, 14, 8],
                      armF: [30, 100], armB: [22, 104],
                      legF: [50, -88], legB: [-38, 78], tail: [262, -38, -28] });
  L.retreatAir  = P({ py: 42, torso: -30, px: -3, head: [-4, 15, -24],
                      armF: [-48, 62], armB: [-56, 58],
                      legF: [-24, 60], legB: [-40, 72], tail: [156, 12, 16] });

  /* ---- Ruby: the crushing bite and the flip kick -------------------------- */

  L.biteWind = P({ py: 36, torso: -16, px: -2, head: [-3, 14, -14],
                   armF: [-10, 96], armB: [-18, 100],
                   legF: [24, -40], legB: [-32, 50], tail: [274, -44, -32] });
  L.biteOut  = P({ py: 38, torso: 34, px: 6, head: [12, 12, 26],
                   armF: [58, 54], armB: [48, 60],
                   legF: [52, -76], legB: [-36, 58], tail: [216, -20, -16] });

  L.flipKickWind = P({ py: 22, torso: 22, head: [4, 13, 10],
                       armF: [24, 96], armB: [16, 100],
                       legF: [62, -118], legB: [-48, 106], tail: [266, -38, -26] });
  L.flipKickUp   = P({ py: 50, torso: -34, px: 1, head: [-6, 15, -30],
                       armF: [-52, 54], armB: [-60, 50],
                       legF: [152, -16], legB: [-30, 42], tail: [146, 18, 22] });
  L.flipKickDown = P({ py: 42, torso: -6, head: [1, 15, -4],
                       armF: [-14, 82], armB: [-22, 78],
                       legF: [58, -70], legB: [-20, 40], tail: [198, -12, -8] });

  /* ---- blending --------------------------------------------------------- */
  function blend(a, b, t) {
    var out = {}, k;
    for (k in a) {
      var av = a[k], bv = (k in b) ? b[k] : a[k];
      if (Array.isArray(av)) {
        var arr = [];
        for (var i = 0; i < av.length; i++) arr.push(U.lerp(av[i], bv[i] === undefined ? av[i] : bv[i], t));
        out[k] = arr;
      } else if (typeof av === 'number') {
        out[k] = U.lerp(av, typeof bv === 'number' ? bv : av, t);
      } else {
        out[k] = t < 0.5 ? av : bv;
      }
    }
    return out;
  }

  /* keys: [{at: frame, p: pose, ease: bool}] — sample at an arbitrary frame */
  function sample(keys, frame) {
    if (!keys || !keys.length) return L.stand;
    if (frame <= keys[0].at) return keys[0].p;
    for (var i = 0; i < keys.length - 1; i++) {
      var a = keys[i], b = keys[i + 1];
      if (frame >= a.at && frame <= b.at) {
        var span = (b.at - a.at) || 1;
        var t = (frame - a.at) / span;
        if (b.ease !== false) t = U.ease(t);
        return blend(a.p, b.p, t);
      }
    }
    return keys[keys.length - 1].p;
  }

  /* loop through an array of poses at n frames each */
  function cycle(poses, framesEach, frame) {
    var total = poses.length * framesEach;
    var f = ((frame % total) + total) % total;
    var i = Math.floor(f / framesEach);
    var t = U.ease((f % framesEach) / framesEach);
    return blend(poses[i], poses[(i + 1) % poses.length], t);
  }

  CF.Pose = L;
  CF.Anim = { blend: blend, sample: sample, cycle: cycle, BASE: BASE, make: P };
})();
