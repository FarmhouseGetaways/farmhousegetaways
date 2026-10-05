/* The hero illustration's small motions (sun rays, ripples, birds, the
   marching trail) are pure CSS and the still frame is complete without them.
   This only pauses them while the hero is scrolled out of view, so the page
   is not animating something nobody can see. No overlays, nothing hidden. */
(function () {
  var art = document.querySelector(".hero-art");
  if (!art || !("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { art.classList.toggle("paused", !e.isIntersecting); });
  });
  io.observe(art);
})();
