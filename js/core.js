/* ============================================================================
   CORE  —  shared utilities, media pool, reveal engine, placeholder system
   Loaded before every other module.
   ============================================================================ */
(function (NS) {
  "use strict";

  var cfg = NS.config;

  /* ---------------------------------------------------------------- basics */
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* Deterministic pseudo-random — so layouts look "scattered" but never
     reshuffle between reloads (a reshuffling photo wall feels broken). */
  function seeded(i) {
    var x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }
  function seededRange(i, min, max) { return min + seeded(i) * (max - min); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ------------------------------------------------------- motion settings */
  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mqTouch  = window.matchMedia("(hover: none), (pointer: coarse)");
  var mqSmall  = window.matchMedia("(max-width: 780px)");

  var env = {
    get reduced() { return mqReduce.matches; },
    get touch()   { return mqTouch.matches; },
    get small()   { return mqSmall.matches; },
    /* Cheap device-capability guess used to scale particle counts down. */
    get lowPower() {
      var cores = navigator.hardwareConcurrency || 4;
      return mqTouch.matches || cores <= 4;
    }
  };

  /* ------------------------------------------------------------ media pool
     Every section pulls photos through `pick()`. It wraps around the pool,
     so the site looks complete whether there are 6 photos or 60.            */
  var photos = (cfg.photos || []).map(function (p, i) {
    return {
      index: i,
      src: p.src,
      caption: p.caption || "",
      feature: !!p.feature,
      portrait: !!p.portrait,
      name: (p.src || "").split("/").pop()
    };
  });

  var videos = (cfg.videos || []).slice();

  /* n photos starting at `offset`, cycling if the pool is smaller than n. */
  function pick(n, offset) {
    var out = [], L = photos.length;
    if (!L) return out;
    offset = offset || 0;
    for (var i = 0; i < n; i++) out.push(photos[(offset + i) % L]);
    return out;
  }

  /* The photos flagged `feature: true` — used for the full-screen moments.
     Falls back to spreading across the pool if none are flagged.            */
  function features() {
    var f = photos.filter(function (p) { return p.feature; });
    if (f.length) return f;
    var out = [], step = Math.max(1, Math.floor(photos.length / 5));
    for (var i = 0; i < photos.length && out.length < 5; i += step) out.push(photos[i]);
    return out;
  }
  function feature(n) {
    var f = features();
    return f.length ? f[n % f.length] : photos[0];
  }

  /* --------------------------------------------------- missing-file poster
     If images/photoNN.jpg isn't there yet, we swap in a designed placeholder
     that names the exact file it wanted. Nothing looks broken, and it tells
     you what to drop in. Disappears the moment you add the real file.       */
  var TINTS = [
    ["#2a2140", "#5b3f6e"], ["#3a2436", "#7a4a5a"], ["#22303f", "#42687e"],
    ["#3b2f24", "#7d5f42"], ["#242f2c", "#41706a"], ["#332440", "#6a4a86"]
  ];

  function placeholder(name, i) {
    var t = TINTS[i % TINTS.length];
    var label = esc(name || "your photo here");
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="' + t[0] + '"/><stop offset="1" stop-color="' + t[1] + '"/>' +
        '</linearGradient></defs>' +
        '<rect width="800" height="1000" fill="url(#g)"/>' +
        '<g fill="none" stroke="rgba(255,255,255,.22)" stroke-width="2" stroke-dasharray="10 10">' +
          '<rect x="40" y="40" width="720" height="920" rx="14"/></g>' +
        '<g transform="translate(400 452)" fill="rgba(255,255,255,.5)">' +
          '<rect x="-64" y="-46" width="128" height="96" rx="12" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="5"/>' +
          '<circle cx="0" cy="4" r="26" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="5"/>' +
          '<rect x="-22" y="-64" width="44" height="20" rx="6"/>' +
        '</g>' +
        '<text x="400" y="566" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" ' +
          'font-size="27" fill="rgba(255,255,255,.92)" letter-spacing="1">' + label + '</text>' +
        '<text x="400" y="606" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" ' +
          'font-size="19" fill="rgba(255,255,255,.5)" letter-spacing="2">DROP THIS FILE IN</text>' +
      '</svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* Build an <img> wired for lazy-loading + graceful fallback. */
  function img(photo, cls, eager) {
    var n = document.createElement("img");
    n.className = cls || "";
    n.alt = photo.caption ? photo.caption : "A photo of the birthday girl";
    n.loading = eager ? "eager" : "lazy";
    n.decoding = "async";
    n.draggable = false;
    n.addEventListener("load", function () { n.classList.add("is-loaded"); }, { once: true });
    n.addEventListener("error", function handle() {
      n.removeEventListener("error", handle);
      n.classList.add("is-placeholder", "is-loaded");
      n.src = placeholder(photo.name, photo.index);
    });
    n.src = photo.src;
    return n;
  }

  /* ---------------------------------------------------------- reveal engine
     One IntersectionObserver drives every entrance animation on the site.
     Elements opt in with [data-reveal]; children stagger via --i.           */
  var revealIO = null;
  function initReveal() {
    if (!("IntersectionObserver" in window)) {
      $$("[data-reveal]").forEach(function (n) { n.classList.add("in"); });
      return;
    }
    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        revealIO.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    $$("[data-reveal]").forEach(function (n) { revealIO.observe(n); });
  }
  /* Anything rendered after boot registers itself here. */
  function observeReveal(root) {
    if (!revealIO) return;
    $$("[data-reveal]", root).forEach(function (n) { revealIO.observe(n); });
    if (root.hasAttribute && root.hasAttribute("data-reveal")) revealIO.observe(root);
  }

  /* ------------------------------------------------- scroll-progress ticker
     A single rAF loop. Modules register callbacks instead of each adding
     their own scroll listener — keeps scrolling smooth with many sections.  */
  var tickers = [], running = false, scrollY = 0, vh = window.innerHeight;

  function addTicker(fn) { tickers.push(fn); start(); return fn; }
  function removeTicker(fn) {
    var i = tickers.indexOf(fn);
    if (i > -1) tickers.splice(i, 1);
  }
  function start() {
    if (running) return;
    running = true;
    requestAnimationFrame(loop);
  }
  function loop() {
    scrollY = window.pageYOffset || document.documentElement.scrollTop;
    for (var i = 0; i < tickers.length; i++) {
      try { tickers[i](scrollY, vh); } catch (err) { /* never kill the loop */ }
    }
    requestAnimationFrame(loop);
  }
  window.addEventListener("resize", function () { vh = window.innerHeight; }, { passive: true });

  /* Progress of an element through the viewport: 0 entering → 1 leaving.

     Geometry is cached per node. Calling getBoundingClientRect() inside the
     rAF loop would force a synchronous reflow on every ticker, every frame —
     with ~8 scroll-driven sections that is the difference between 60fps and
     visible jank. The cache is invalidated on resize and once images land. */
  var geo = new WeakMap(), epoch = 0;

  function measureNode(node) {
    var top = 0, n = node;
    while (n) { top += n.offsetTop; n = n.offsetParent; }
    return { top: top, height: node.offsetHeight, epoch: epoch };
  }

  function progress(node, y, height) {
    var g = geo.get(node);
    if (!g || g.epoch !== epoch) {
      g = measureNode(node);
      geo.set(node, g);
    }
    var total = g.height + height;
    if (total <= 0) return 0;
    return clamp((y + height - g.top) / total, 0, 1);
  }

  function invalidateGeometry() { epoch++; }

  var reflowTimer = 0;
  function scheduleInvalidate() {
    clearTimeout(reflowTimer);
    reflowTimer = setTimeout(invalidateGeometry, 120);
  }
  window.addEventListener("resize", scheduleInvalidate, { passive: true });
  window.addEventListener("load", invalidateGeometry);
  document.addEventListener("load", scheduleInvalidate, true);   // late images

  /* --------------------------------------------------------- scroll locking
     Body-fixed technique so iOS Safari actually respects it.                */
  var lockCount = 0, savedY = 0;
  function lockScroll() {
    if (lockCount++ > 0) return;
    savedY = window.pageYOffset;
    document.body.style.position = "fixed";
    document.body.style.top = -savedY + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
  }
  function unlockScroll() {
    if (--lockCount > 0) return;
    lockCount = 0;
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.overflow = "";
    window.scrollTo(0, savedY);
  }

  /* ------------------------------------------------------------- utilities */
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* Splits text into per-word spans for staggered reveals. */
  function splitWords(node) {
    var text = node.textContent.trim();
    node.textContent = "";
    text.split(/\s+/).forEach(function (w, i) {
      var wrap = el("span", "w");
      var inner = el("span", "w-i", esc(w));
      inner.style.transitionDelay = (i * 42) + "ms";
      wrap.appendChild(inner);
      node.appendChild(wrap);
      node.appendChild(document.createTextNode(" "));
    });
  }

  /* Focus trap for dialogs (lightbox, modals, finale). */
  function trapFocus(container) {
    var sel = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
    function onKey(e) {
      if (e.key !== "Tab") return;
      var f = $$(sel, container).filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener("keydown", onKey);
    return function () { container.removeEventListener("keydown", onKey); };
  }

  NS.core = {
    $: $, $$: $$, el: el, esc: esc,
    clamp: clamp, lerp: lerp, seeded: seeded, seededRange: seededRange,
    env: env,
    photos: photos, videos: videos,
    pick: pick, feature: feature, features: features,
    img: img, placeholder: placeholder,
    initReveal: initReveal, observeReveal: observeReveal,
    addTicker: addTicker, removeTicker: removeTicker, progress: progress,
    invalidateGeometry: invalidateGeometry,
    lockScroll: lockScroll, unlockScroll: unlockScroll,
    wait: wait, splitWords: splitWords, trapFocus: trapFocus
  };

})(window.BDAY);
