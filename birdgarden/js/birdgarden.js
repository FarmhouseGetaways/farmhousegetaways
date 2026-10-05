/* The peacock's tail. Fanned is the resting CSS state; with JS the page paints
   it folded, then opens it. If anything stalls the transition (a background
   tab, a frozen timeline), the timer adds .settled, which drops the transition
   so the tail snaps to full display regardless. The pill toggles it after. */
(function () {
  var plate = document.getElementById("plate");
  if (!plate) return;
  var btn = plate.querySelector(".fan-toggle");
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { plate.classList.add("fanned"); });
  });
  setTimeout(function () { plate.classList.add("fanned", "settled"); }, 2800);

  if (!btn) return;
  btn.hidden = false;
  btn.addEventListener("click", function () {
    plate.classList.remove("settled");
    var open = plate.classList.toggle("fanned");
    btn.setAttribute("aria-pressed", open ? "true" : "false");
    btn.textContent = open ? "Fold the tail" : "Fan the tail";
  });
})();

/* The egg carton lid lifts once the carton is on screen, then is removed.
   Without IntersectionObserver it is simply never shown. */
(function () {
  var carton = document.querySelector(".carton");
  if (!carton) return;
  function lift() {
    carton.classList.add("open");
    setTimeout(function () { carton.classList.add("lid-gone"); }, 1800);
  }
  if (!("IntersectionObserver" in window)) { carton.classList.add("lid-gone"); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { lift(); io.disconnect(); }
    });
  }, { threshold: 0.35 });
  io.observe(carton);
})();
