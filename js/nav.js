/* ============================================================================
   NAV  —  floating glass pill navigation, scroll progress, and the
   background mood system (each section declares data-mood; the fixed backdrop
   crossfades between gradient layers rather than hard-switching).
   ============================================================================ */
(function (NS) {
  "use strict";

  var core = NS.core, cfg = NS.config;
  var $ = core.$, $$ = core.$$, el = core.el, env = core.env, esc = core.esc;

  var MOODS = ["dream", "playful", "warm", "editorial", "dusk", "night", "gold"];

  /* --------------------------------------------------------- background */
  function background() {
    var bg = el("div", "bg");
    bg.setAttribute("aria-hidden", "true");
    MOODS.forEach(function (m) {
      var layer = el("div", "bg-layer bg-" + m);
      layer.dataset.mood = m;
      bg.appendChild(layer);
    });
    bg.appendChild(el("div", "bg-grain"));
    document.body.insertBefore(bg, document.body.firstChild);

    var layers = {};
    $$(".bg-layer", bg).forEach(function (l) { layers[l.dataset.mood] = l; });

    var sections = $$("[data-mood]");
    var current = null;

    function apply(mood) {
      if (mood === current) return;
      current = mood;
      MOODS.forEach(function (m) {
        layers[m].style.opacity = m === mood ? "1" : "0";
      });
      document.documentElement.setAttribute("data-mood", mood);
    }

    apply(sections.length ? sections[0].dataset.mood : "dream");

    if ("IntersectionObserver" in window) {
      // Whichever section owns the middle of the screen sets the mood.
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) apply(e.target.dataset.mood);
        });
      }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
      sections.forEach(function (s) { io.observe(s); });
    }
  }

  /* ----------------------------------------------------------- progress */
  function progress() {
    var line = el("div", "sprog");
    line.setAttribute("aria-hidden", "true");
    line.innerHTML = '<i></i>';
    document.body.appendChild(line);
    var fill = $("i", line);

    core.addTicker(function (y) {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? core.clamp(y / max, 0, 1) : 0;
      fill.style.transform = "scaleX(" + p.toFixed(4) + ")";
    });
  }

  /* ---------------------------------------------------------------- nav */
  function pill() {
    var items = cfg.nav.filter(function (n) { return document.getElementById(n.id); });
    if (!items.length) return;

    var nav = el("nav", "pill");
    nav.setAttribute("aria-label", "Sections");

    var list = el("ul", "pill-list");
    items.forEach(function (n) {
      var li = el("li");
      var a = el("a", "pill-dot");
      a.href = "#" + n.id;
      a.dataset.target = n.id;
      a.innerHTML = '<span class="pill-mark" aria-hidden="true"></span>' +
                    '<span class="pill-label">' + esc(n.label) + '</span>';
      a.setAttribute("aria-label", "Go to " + n.label);
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var t = document.getElementById(n.id);
        if (!t) return;
        t.scrollIntoView({ behavior: env.reduced ? "auto" : "smooth", block: "start" });
        // Move focus for keyboard users without yanking the scroll position.
        t.setAttribute("tabindex", "-1");
        setTimeout(function () { t.focus({ preventScroll: true }); }, env.reduced ? 0 : 700);
      });
      li.appendChild(a);
      list.appendChild(li);
    });

    nav.appendChild(list);
    document.body.appendChild(nav);

    var dots = $$(".pill-dot", nav);
    var targets = items.map(function (n) { return document.getElementById(n.id); });

    /* Active state + auto-hide while scrolling down, reveal on scroll up. */
    var lastY = 0, hidden = false;
    core.addTicker(function (y, vh) {
      var mid = y + vh * 0.42, best = 0;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i].offsetTop <= mid) best = i;
      }
      dots.forEach(function (d, i) {
        d.classList.toggle("on", i === best);
        if (i === best) d.setAttribute("aria-current", "true");
        else d.removeAttribute("aria-current");
      });

      var down = y > lastY + 4;
      var up = y < lastY - 4;
      if (down && y > vh * 0.9 && !hidden) { hidden = true; nav.classList.add("tuck"); }
      else if (up && hidden) { hidden = false; nav.classList.remove("tuck"); }
      if (Math.abs(y - lastY) > 4) lastY = y;
    });

    nav.addEventListener("pointerenter", function () {
      hidden = false; nav.classList.remove("tuck");
    });
  }

  function boot() {
    background();
    progress();
    pill();
  }

  NS.nav = { boot: boot };

})(window.BDAY);
