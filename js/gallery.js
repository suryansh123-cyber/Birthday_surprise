/* ============================================================================
   GALLERY  —  every photo treatment on the site.

   All of these read from the same pool (BDAY.core.photos) via `pick()`, which
   wraps around. Add a photo to config.js and it shows up everywhere at once.

     A  polaroids   floating scattered polaroid cards
     B  cinematic   full-screen masked reveal moments
     C  filmstrip   horizontal contact-sheet (scroll-driven on desktop)
     D  masonry     editorial archive grid
     E  evidence    layered parallax depth composition
     F  feed        social-feed metaphor
     G  wall        scattered scrapbook collage w/ neighbour repulsion
     H  stills      one-photo-at-a-time scroll cinema
   ============================================================================ */
(function (NS) {
  "use strict";

  var core = NS.core, lb = NS.lightbox;
  var $ = core.$, $$ = core.$$, el = core.el, env = core.env;
  var clamp = core.clamp, lerp = core.lerp, sr = core.seededRange;

  /* A photo card that opens the lightbox. Used by most treatments. */
  function card(photo, set, i, cls) {
    var b = el("button", "pcard " + (cls || ""));
    b.type = "button";
    b.setAttribute("aria-label", "Open photo" + (photo.caption ? ": " + photo.caption : ""));
    var frame = el("span", "pcard-frame");
    frame.appendChild(core.img(photo, "pcard-img"));
    b.appendChild(frame);
    lb.bind(b, set, i);
    return b;
  }

  /* ================================================== A — FLOATING POLAROIDS */
  function polaroids(host, count) {
    var set = core.pick(count || 5, 0);
    var wrap = el("div", "polaroids");

    set.forEach(function (p, i) {
      var pol = el("button", "polaroid");
      pol.type = "button";
      pol.setAttribute("aria-label", "Open photo" + (p.caption ? ": " + p.caption : ""));

      var f = el("span", "polaroid-frame");
      f.appendChild(core.img(p, "polaroid-img", i < 2));
      pol.appendChild(f);
      pol.appendChild(el("span", "polaroid-cap", core.esc(p.caption || "")));

      // Seeded so the scatter is identical on every reload.
      pol.style.setProperty("--rot", sr(i * 3 + 1, -9, 9).toFixed(2) + "deg");
      pol.style.setProperty("--dx",  sr(i * 5 + 2, -4, 4).toFixed(2) + "%");
      pol.style.setProperty("--dy",  sr(i * 7 + 3, -5, 5).toFixed(2) + "%");
      pol.style.setProperty("--delay", (i * 130) + "ms");
      pol.style.setProperty("--float", (7 + sr(i, 0, 4)).toFixed(1) + "s");

      lb.bind(pol, set, i);
      wrap.appendChild(pol);
    });

    host.appendChild(wrap);

    // Gentle pointer parallax — the stack leans toward the cursor.
    if (!env.touch && !env.reduced) {
      var tx = 0, ty = 0, cx = 0, cy = 0;
      host.addEventListener("pointermove", function (e) {
        var r = host.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      });
      host.addEventListener("pointerleave", function () { tx = ty = 0; });
      core.addTicker(function () {
        cx = lerp(cx, tx, 0.06); cy = lerp(cy, ty, 0.06);
        if (Math.abs(cx) < 0.001 && Math.abs(cy) < 0.001) return;
        $$(".polaroid", wrap).forEach(function (n, i) {
          var d = 1 + (i % 3) * 0.55;
          n.style.setProperty("--px", (cx * 13 * d).toFixed(2) + "px");
          n.style.setProperty("--py", (cy * 10 * d).toFixed(2) + "px");
        });
      });
    }
  }

  /* ================================================ B — CINEMATIC REVEAL */
  /* A sticky stage where one photo takes over the screen, gated on scroll so
     it feels like *she* is revealing it rather than a timer firing.        */
  function cinematic(section, photo, lines) {
    var stage = el("div", "cine-stage");
    var pre   = el("p", "cine-pre", core.esc(lines.pre || ""));
    var wrap  = el("button", "cine-photo");
    wrap.type = "button";
    wrap.setAttribute("aria-label", "Open photo" + (photo.caption ? ": " + photo.caption : ""));
    wrap.appendChild(core.img(photo, "cine-img"));
    var post = el("p", "cine-post", core.esc(lines.post || photo.caption || ""));

    lb.bind(wrap, [photo], 0);

    stage.appendChild(pre);
    stage.appendChild(wrap);
    stage.appendChild(post);
    section.appendChild(stage);

    core.addTicker(function (y, vh) {
      var t = core.progress(section, y, vh);

      // 0.00–0.22  "Okay wait..."      fades in then out
      // 0.18–0.62  photo unmasks and grows toward full-bleed
      // 0.62–1.00  caption lands, everything settles
      var a1 = t < 0.06 ? t / 0.06 : t < 0.24 ? 1 : clamp(1 - (t - 0.24) / 0.1, 0, 1);
      pre.style.opacity = a1.toFixed(3);
      pre.style.transform = "translateY(" + ((1 - a1) * 14).toFixed(1) + "px)";

      var r = clamp((t - 0.16) / 0.42, 0, 1);
      var eased = 1 - Math.pow(1 - r, 3);
      var inset = (1 - eased) * 50;
      wrap.style.clipPath = "inset(" + inset.toFixed(2) + "% " + inset.toFixed(2) + "% round 22px)";
      wrap.style.opacity = clamp(r * 3, 0, 1).toFixed(3);
      wrap.style.transform = "scale(" + lerp(1.14, 1, eased).toFixed(4) + ")";

      var a2 = clamp((t - 0.6) / 0.16, 0, 1);
      post.style.opacity = a2.toFixed(3);
      post.style.transform = "translateY(" + ((1 - a2) * 16).toFixed(1) + "px)";
    });
  }

  /* ==================================================== C — FILM STRIP */
  /* Desktop: vertical scroll drives horizontal travel inside a sticky stage.
     Mobile:  a plain swipeable overflow strip with snap points.          */
  function filmstrip(section, count) {
    var set = core.pick(count || 14, 3);
    var stage = el("div", "strip-stage");
    var track = el("div", "strip-track");

    set.forEach(function (p, i) {
      var c = card(p, set, i, "strip-card");
      // Varying sizes keep it reading as a contact sheet, not a carousel.
      var size = i % 4 === 0 ? "lg" : i % 3 === 0 ? "sm" : "md";
      c.classList.add("s-" + size);
      c.style.setProperty("--lift", sr(i * 11, -14, 14).toFixed(1) + "px");
      var cap = el("span", "strip-cap", core.esc(p.caption || ""));
      c.appendChild(cap);
      track.appendChild(c);
    });

    stage.appendChild(track);
    section.appendChild(stage);

    var travel = 0;
    /* Vertical scroll is deliberately shorter than the horizontal distance —
       mapping them 1:1 makes a wide strip cost 7 screens of dead scrolling.
       At 0.55 the strip glides past noticeably faster than the wheel. */
    var RATIO = 0.55;
    function measure() {
      travel = Math.max(0, track.scrollWidth - window.innerWidth + 80);
      section.style.setProperty("--strip-h",
        Math.round(travel * RATIO + window.innerHeight) + "px");
    }
    measure();
    window.addEventListener("resize", measure, { passive: true });
    // Images arriving late change scrollWidth — remeasure once they land.
    $$("img", track).forEach(function (im) {
      im.addEventListener("load", measure, { once: true });
    });

    core.addTicker(function (y, vh) {
      if (env.small) { track.style.transform = ""; return; }   // native swipe on mobile
      var t = core.progress(section, y, vh);
      // Hold still briefly at each end so entry/exit don't feel clipped.
      var s = clamp((t - 0.08) / 0.84, 0, 1);
      track.style.transform = "translate3d(" + (-s * travel).toFixed(1) + "px,0,0)";
    });
  }

  /* ====================================================== D — MASONRY */
  function masonry(host, count, offset) {
    var set = core.pick(count || 18, offset || 6);
    var grid = el("div", "masonry");

    set.forEach(function (p, i) {
      var c = card(p, set, i, "mas-card");
      c.setAttribute("data-reveal", "");
      c.style.setProperty("--i", i % 12);
      if (p.portrait) c.classList.add("tall");
      else if (i % 5 === 0) c.classList.add("wide");
      var cap = el("span", "mas-cap", core.esc(p.caption || ""));
      c.appendChild(cap);
      grid.appendChild(c);
    });

    host.appendChild(grid);
    core.observeReveal(grid);
  }

  /* =============================================== E — EVIDENCE (parallax) */
  /* A layered depth composition: photos drift at different speeds, the ones
     behind blur and desaturate, the focal one comes forward.               */
  function evidence(section, count) {
    var n = env.small ? 7 : (count || 11);
    var set = core.pick(n, 1);
    var stage = el("div", "ev-stage");
    var layer = el("div", "ev-layer");

    // Hand-placed slots so the composition is designed, not random soup.
    var SLOTS = [
      { x: 12, y: 14, w: 24, d: 0.30, r: -4 },
      { x: 66, y:  8, w: 20, d: 0.62, r:  5 },
      { x: 38, y: 30, w: 30, d: 0.14, r:  0 },
      { x:  4, y: 58, w: 22, d: 0.74, r:  6 },
      { x: 74, y: 48, w: 25, d: 0.24, r: -6 },
      { x: 26, y: 74, w: 21, d: 0.52, r:  3 },
      { x: 56, y: 78, w: 27, d: 0.40, r: -3 },
      { x: 86, y: 26, w: 17, d: 0.86, r:  8 },
      { x:  2, y: 34, w: 18, d: 0.68, r: -8 },
      { x: 44, y: 56, w: 23, d: 0.20, r:  2 },
      { x: 70, y: 68, w: 19, d: 0.58, r:  4 }
    ];

    var nodes = [];
    set.forEach(function (p, i) {
      var s = SLOTS[i % SLOTS.length];
      var c = card(p, set, i, "ev-card");
      // Phones get fewer, bigger cards — but they must still fit the stage,
      // so the slot's x is pulled back if the wider card would run off-edge.
      var w = env.small ? Math.min(s.w * 1.55, 46) : s.w;
      var x = env.small ? Math.min(s.x, 100 - w - 2) : s.x;
      c.style.left = x + "%";
      c.style.top = s.y + "%";
      c.style.width = w + "%";
      c.style.setProperty("--rot", s.r + "deg");
      c.style.zIndex = String(100 - Math.round(s.d * 90));
      layer.appendChild(c);
      nodes.push({ node: c, depth: s.d, born: i / set.length });
    });

    stage.appendChild(layer);
    var cap = el("p", "ev-caption");
    stage.appendChild(cap);
    section.appendChild(stage);

    var captions = set.map(function (p) { return p.caption; }).filter(Boolean);
    var shownCap = -1;

    core.addTicker(function (y, vh) {
      var t = core.progress(section, y, vh);

      nodes.forEach(function (o, i) {
        // Near cards travel far and fast; distant ones barely move. Depth.
        var speed = lerp(230, 40, o.depth);
        var ty = (0.5 - t) * speed;
        var scale = lerp(1.10, 0.94, clamp(t * 1.2, 0, 1)) + (1 - o.depth) * 0.05;

        // Each card fades in as its own slice of the scroll passes.
        var a = clamp((t - o.born * 0.32) / 0.16, 0, 1) * clamp((1.06 - t) / 0.2, 0, 1);

        o.node.style.transform =
          "translate3d(0," + ty.toFixed(1) + "px,0) scale(" + scale.toFixed(3) + ") " +
          "rotate(var(--rot))";
        o.node.style.opacity = a.toFixed(3);
        o.node.style.filter = o.depth > 0.45
          ? "blur(" + (o.depth * 3.2).toFixed(2) + "px) saturate(" + (1 - o.depth * 0.4).toFixed(2) + ")"
          : "none";
      });

      if (captions.length) {
        var k = clamp(Math.floor(t * captions.length), 0, captions.length - 1);
        if (k !== shownCap) {
          shownCap = k;
          cap.textContent = captions[k];
          cap.classList.remove("in");
          void cap.offsetWidth;                 // restart the fade
          cap.classList.add("in");
        }
      }
    });
  }

  /* ========================================================= F — FEED */
  function feed(host, handle) {
    var hero = core.pick(1, 10)[0];
    var grid = core.pick(env.small ? 4 : 6, 11);
    var all = [hero].concat(grid);

    var w = el("div", "feed");
    w.innerHTML =
      '<div class="feed-head">' +
        '<span class="feed-av" aria-hidden="true"></span>' +
        '<span class="feed-handle">@' + core.esc(handle) + '</span>' +
        '<span class="feed-dot" aria-hidden="true">•</span>' +
        '<span class="feed-follow">following, obviously</span>' +
      '</div>';

    var heroWrap = el("div", "feed-hero");
    heroWrap.appendChild(card(hero, all, 0, "feed-card"));
    heroWrap.appendChild(el("p", "feed-cap", "creator mode: ON 🎬"));
    w.appendChild(heroWrap);

    var g = el("div", "feed-grid");
    grid.forEach(function (p, i) {
      var c = card(p, all, i + 1, "feed-card");
      c.setAttribute("data-reveal", "");
      c.style.setProperty("--i", i);
      g.appendChild(c);
    });
    w.appendChild(g);
    w.appendChild(el("p", "feed-foot", "no likes, no comments, no algorithm. just a good archive."));

    host.appendChild(w);
    core.observeReveal(w);
  }

  /* ==================================================== G — PHOTO WALL */
  function wall(host, count) {
    var set = core.pick(count || (env.small ? 12 : 20), 4);
    var w = el("div", "wall");

    set.forEach(function (p, i) {
      var c = card(p, set, i, "wall-card");
      c.setAttribute("data-reveal", "fade");   // owns its rotation — see base.css
      c.style.setProperty("--i", i % 10);
      c.style.setProperty("--rot", sr(i * 13 + 5, -8, 8).toFixed(2) + "deg");
      // Vertical jitter + varied stacking is what turns a grid into a wall.
      c.style.setProperty("--ty", sr(i * 17 + 9, -18, 18).toFixed(1) + "px");
      c.style.zIndex = String(2 + Math.round(sr(i * 23 + 4, 0, 6)));
      // Mixed shapes stop it reading as a grid.
      var shape = p.portrait ? "tall" : (i % 7 === 0 ? "wide" : (i % 3 === 0 ? "square" : "tall"));
      c.classList.add("w-" + shape);
      if (p.caption) c.appendChild(el("span", "wall-cap", core.esc(p.caption)));
      w.appendChild(c);
    });

    host.appendChild(w);
    core.observeReveal(w);

    /* Desktop only: hovering a card gently pushes its neighbours aside. */
    if (env.touch || env.reduced) return;

    var cards = $$(".wall-card", w), centers = [];
    function measure() {
      centers = cards.map(function (c) {
        var r = c.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    }
    var pending = false;
    function scheduleMeasure() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; measure(); });
    }
    window.addEventListener("resize", scheduleMeasure, { passive: true });
    window.addEventListener("scroll", scheduleMeasure, { passive: true });

    cards.forEach(function (c, i) {
      c.addEventListener("pointerenter", function () {
        measure();
        var me = centers[i];
        cards.forEach(function (o, j) {
          if (j === i) return;
          var dx = centers[j].x - me.x, dy = centers[j].y - me.y;
          var dist = Math.hypot(dx, dy);
          if (dist > 320 || dist === 0) return;
          var push = (1 - dist / 320) * 26;
          o.style.setProperty("--nx", ((dx / dist) * push).toFixed(1) + "px");
          o.style.setProperty("--ny", ((dy / dist) * push).toFixed(1) + "px");
        });
      });
      c.addEventListener("pointerleave", function () {
        cards.forEach(function (o) {
          o.style.setProperty("--nx", "0px");
          o.style.setProperty("--ny", "0px");
        });
      });
    });
  }

  /* ========================================= H — ONE PHOTO AT A TIME */
  function stills(section, count) {
    var set = core.pick(count || 5, 8);
    var stage = el("div", "stills-stage");
    var deck = el("div", "stills-deck");

    var frames = set.map(function (p, i) {
      var f = el("button", "still");
      f.type = "button";
      f.setAttribute("aria-label", "Open photo" + (p.caption ? ": " + p.caption : ""));
      f.appendChild(core.img(p, "still-img", i === 0));
      lb.bind(f, set, i);
      deck.appendChild(f);
      return f;
    });

    var capEl = el("p", "stills-cap");
    var idxEl = el("div", "stills-index");
    idxEl.innerHTML = '<span class="stills-n">01</span><span class="stills-bar"><i></i></span>' +
                      '<span class="stills-total">' + pad(set.length) + '</span>';

    stage.appendChild(deck);
    stage.appendChild(capEl);
    stage.appendChild(idxEl);
    section.appendChild(stage);

    section.style.setProperty("--stills-h", (set.length * 78 + 45) + "vh");

    var bar = $("i", idxEl), nEl = $(".stills-n", idxEl);
    var active = -1;

    core.addTicker(function (y, vh) {
      var t = core.progress(section, y, vh);
      var raw = clamp(t * 1.06 - 0.03, 0, 0.9999) * set.length;
      var i = Math.floor(raw);
      var frac = raw - i;

      frames.forEach(function (f, k) {
        var on = k === i;
        f.classList.toggle("on", on);
        if (on) {
          // Slow push-in across the photo's slice — cinematic, not jumpy.
          f.style.transform = "scale(" + (1.04 + frac * 0.05).toFixed(4) + ")";
          f.style.clipPath = "inset(" + (frac < 0.12 ? (1 - frac / 0.12) * 8 : 0).toFixed(2) + "% round 18px)";
        }
      });

      bar.style.transform = "scaleX(" + (raw / set.length).toFixed(4) + ")";

      if (i !== active) {
        active = i;
        nEl.textContent = pad(i + 1);
        capEl.textContent = set[i].caption || "";
        capEl.classList.remove("in");
        void capEl.offsetWidth;
        capEl.classList.add("in");
        // Background hue drifts with the active photo.
        stage.style.setProperty("--hue", (i * 47) % 360);
      }
    });
  }

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  NS.gallery = {
    polaroids: polaroids, cinematic: cinematic, filmstrip: filmstrip,
    masonry: masonry, evidence: evidence, feed: feed, wall: wall,
    stills: stills, card: card
  };

})(window.BDAY);
