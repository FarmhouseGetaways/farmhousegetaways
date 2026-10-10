/* The Oasis gate swings open once the page has painted. Open is the resting
   state in the CSS; the closed look only exists while JavaScript is running
   with full motion. If anything stalls the transition (a background tab, a
   frozen timeline), the timer below sets the final open state regardless. */
(function () {
  var scene = document.querySelector(".scene");
  if (!scene) return;
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { scene.classList.add("gate-open"); });
  });
  setTimeout(function () { scene.classList.add("gate-open", "gate-done"); }, 2600);
})();

/* Afternoon or evening. The page is drawn by day; this button, and an
   evening visit, swap the scene to dusk with the Oasis lights on. */
(function () {
  var hero = document.querySelector(".hero");
  var btn = document.getElementById("time-toggle");
  if (!hero || !btn) return;
  var label = btn.querySelector(".t-label");
  function set(dusk) {
    hero.setAttribute("data-time", dusk ? "dusk" : "day");
    btn.setAttribute("aria-pressed", dusk ? "true" : "false");
    label.textContent = dusk ? "See it by day" : "See it at dusk";
  }
  var h = new Date().getHours();
  set(location.hash === "#dusk" || h >= 19 || h < 6);
  btn.hidden = false;
  btn.addEventListener("click", function () {
    set(hero.getAttribute("data-time") !== "dusk");
  });
})();
