/* The neon sign is lit in the markup. This only plays the switch-on: it adds
   .flicker, and a timer takes it away again whatever the animation is doing
   (a background tab, a frozen timeline), so the sign always ends up lit.
   With reduced motion nothing here runs and the sign is simply on. */
(function () {
  var sign = document.querySelector(".neon");
  if (!sign) return;
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (still) return;
  sign.classList.add("flicker");
  setTimeout(function () {
    sign.classList.remove("flicker");
    sign.classList.add("buzz");
  }, 3400);
})();

/* Seat map: the pills show one side of the room at a time. Without
   JavaScript the pills stay hidden and the whole room is shown. */
(function () {
  var map = document.querySelector(".seatmap");
  if (!map) return;
  var group = map.querySelector(".seat-toggle");
  var buttons = map.querySelectorAll(".pill-tog");
  group.hidden = false;
  buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      map.setAttribute("data-view", b.getAttribute("data-view"));
      buttons.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
    });
  });
})();
