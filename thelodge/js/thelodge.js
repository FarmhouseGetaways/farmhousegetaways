/* The lantern glows on. The poster is lit at rest; this dims the lantern and
   the windows for a moment after load and lets them fade back up. If the fade
   never runs (a background tab, a frozen timeline), the second timer switches
   the transition off, so the stand always ends up lit. With reduced motion
   nothing is dimmed at all. */
(function () {
  var scene = document.querySelector(".scene");
  if (!scene) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  scene.classList.add("dim");
  setTimeout(function () { scene.classList.remove("dim"); }, 900);
  setTimeout(function () { scene.classList.add("settled"); }, 3200);
})();
