/* The barn doors slide open once the page has painted. They are decoration
   only: if anything stops the transition (a background tab, a frozen
   timeline), the timer below takes them away regardless, so the page is
   never left behind closed doors. With reduced motion the CSS never shows them. */
(function () {
  var doors = document.querySelector(".doors");
  if (!doors) return;
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { doors.classList.add("open"); });
  });
  setTimeout(function () { doors.classList.add("gone"); }, 2600);
})();

/* Small reveals as cards come on screen. Without IntersectionObserver
   everything is simply shown in its final state. */
(function () {
  var cards = document.querySelectorAll(".ticket-type");
  if (!("IntersectionObserver" in window)) {
    cards.forEach(function (c) { c.classList.add("seen"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("seen"); io.unobserve(e.target); }
    });
  }, { threshold: 0.4 });
  cards.forEach(function (c) { io.observe(c); });
})();
