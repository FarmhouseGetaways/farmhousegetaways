/* The blueprints draw themselves in, as on /imm/. The line work is fully drawn
   by default: this script adds .drawing to start the animation and a timer
   always takes it away again, so even if the timeline is frozen (a background
   tab, a headless capture) the drawing ends complete. With reduced motion
   nothing is added. The hero draws on load; every svg[data-draw] draws when it
   scrolls into view. */
(function () {
  if (!window.matchMedia || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function draw(svg) {
    svg.classList.add("drawing");
    setTimeout(function () { svg.classList.remove("drawing"); }, 4600);
  }

  var hero = document.querySelector(".bp-elev");
  if (hero) draw(hero);

  var stamp = document.querySelector(".stamp");
  if (stamp) {
    stamp.classList.add("landing");
    setTimeout(function () { stamp.classList.remove("landing"); }, 2400);
  }

  var sheets = document.querySelectorAll("svg[data-draw]");
  if (!sheets.length || !("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { draw(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.35 });
  sheets.forEach(function (s) { io.observe(s); });
})();
