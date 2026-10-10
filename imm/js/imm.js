/* The blueprints draw themselves in. The line work is fully drawn by default:
   this script adds .drawing to start the animation and a timer always takes it
   away again, so even if the timeline is frozen (a background tab, a headless
   capture) the drawing ends complete. With reduced motion nothing is added. */
(function () {
  if (!window.matchMedia || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function draw(svg) {
    svg.classList.add("drawing");
    setTimeout(function () { svg.classList.remove("drawing"); }, 4600);
  }

  var hero = document.querySelector(".bp-elev");
  if (hero) draw(hero);

  var plan = document.querySelector(".bp-plan");
  if (!plan || !("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { draw(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.35 });
  io.observe(plan);
})();
