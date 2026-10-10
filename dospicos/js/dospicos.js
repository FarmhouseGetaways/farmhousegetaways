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

/* On a phone the map is shown 5:4 (see dospicos.css), framed on the part
   from the house to the playground so every labelled landmark stays in view. */
(function () {
  var svg = document.querySelector(".hero-art svg");
  if (!svg || !window.matchMedia) return;
  var mq = window.matchMedia("(max-width: 39.99rem)");
  function fit() { svg.setAttribute("viewBox", mq.matches ? "350 0 1200 900" : "0 0 1600 900"); }
  fit();
  if (mq.addEventListener) mq.addEventListener("change", fit);
  else if (mq.addListener) mq.addListener(fit);
})();
