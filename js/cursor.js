/* ============================================================================
   CURSOR  —  a small glowing dot with a lagging ring.
   Desktop + fine-pointer only, skipped under reduced-motion. The real system
   cursor is never hidden, so nothing is ever "lost" if this misbehaves.
   ============================================================================ */
(function (NS) {
  "use strict";

  var core = NS.core, env = core.env;
  var el = core.el;

  function boot() {
    if (env.touch || env.reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    var dot  = el("div", "cur-dot");
    var ring = el("div", "cur-ring");
    dot.setAttribute("aria-hidden", "true");
    ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(ring);
    document.body.appendChild(dot);

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var dx = mx, dy = my, rx = mx, ry = my;
    var alive = false, raf = 0;

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY;
      if (!alive) {
        alive = true;
        dx = rx = mx; dy = ry = my;
        document.body.classList.add("cur-on");
        raf = requestAnimationFrame(frame);
      }
    }, { passive: true });

    document.addEventListener("pointerleave", function () {
      document.body.classList.remove("cur-on");
    });
    document.addEventListener("pointerenter", function () {
      if (alive) document.body.classList.add("cur-on");
    });

    function frame() {
      dx += (mx - dx) * 0.42;
      dy += (my - dy) * 0.42;
      rx += (mx - rx) * 0.13;
      ry += (my - ry) * 0.13;
      dot.style.transform  = "translate3d(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px,0) translate(-50%,-50%)";
      ring.style.transform = "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0) translate(-50%,-50%) scale(var(--s,1))";
      raf = requestAnimationFrame(frame);
    }

    /* Expand over anything interactive — delegated, so it also covers
       elements rendered later by the gallery/section modules. */
    var HOT = "a,button,[role=button],input,summary,.pcard,.polaroid,.trait,.world-card,.myst";
    document.addEventListener("pointerover", function (e) {
      if (e.target.closest && e.target.closest(HOT)) ring.classList.add("hot");
    });
    document.addEventListener("pointerout", function (e) {
      if (e.target.closest && e.target.closest(HOT)) ring.classList.remove("hot");
    });
    document.addEventListener("pointerdown", function () { ring.classList.add("press"); });
    document.addEventListener("pointerup",   function () { ring.classList.remove("press"); });
  }
  /* Note: `cur-on` is deliberately added only on the first real pointermove
     (see the handler above). Adding it at boot parks a visible dot at 0,0
     until the mouse happens to move. */

  NS.cursor = { boot: boot };

})(window.BDAY);
