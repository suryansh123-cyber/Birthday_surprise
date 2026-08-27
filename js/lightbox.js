/* ============================================================================
   LIGHTBOX  —  full-screen photo viewer.
   Keyboard (← → Esc), swipe on touch, counter, caption, backdrop blur,
   focus trap, scroll lock, and preloading of the neighbouring images.
   ============================================================================ */
(function (NS) {
  "use strict";

  var core = NS.core;
  var $ = core.$, el = core.el, env = core.env;

  var root, imgWrap, capEl, countEl, prevBtn, nextBtn, closeBtn;
  var list = [], idx = 0, open = false, releaseTrap = null, lastFocus = null;
  var built = false;

  function build() {
    if (built) return;
    built = true;

    root = el("div", "lb");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Photo viewer");
    root.hidden = true;
    root.innerHTML =
      '<div class="lb-backdrop"></div>' +
      '<button type="button" class="lb-close" aria-label="Close photo viewer">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
        '<path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.6" ' +
        'stroke-linecap="round" fill="none"/></svg></button>' +
      '<div class="lb-stage">' +
        '<div class="lb-figure"></div>' +
      '</div>' +
      '<div class="lb-bar">' +
        '<button type="button" class="lb-nav lb-prev" aria-label="Previous photo">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
          '<path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="1.7" ' +
          'stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></button>' +
        '<div class="lb-meta">' +
          '<p class="lb-cap"></p>' +
          '<p class="lb-count" aria-live="polite"></p>' +
        '</div>' +
        '<button type="button" class="lb-nav lb-next" aria-label="Next photo">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
          '<path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="1.7" ' +
          'stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></button>' +
      '</div>';
    document.body.appendChild(root);

    imgWrap  = $(".lb-figure", root);
    capEl    = $(".lb-cap", root);
    countEl  = $(".lb-count", root);
    prevBtn  = $(".lb-prev", root);
    nextBtn  = $(".lb-next", root);
    closeBtn = $(".lb-close", root);

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () { go(-1); });
    nextBtn.addEventListener("click", function () { go(1); });
    $(".lb-backdrop", root).addEventListener("click", close);

    document.addEventListener("keydown", onKey);
    bindSwipe();
  }

  function onKey(e) {
    if (!open) return;
    if (e.key === "Escape")      { e.preventDefault(); close(); }
    else if (e.key === "ArrowLeft")  { e.preventDefault(); go(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
  }

  function bindSwipe() {
    var x0 = 0, y0 = 0, t0 = 0, tracking = false;
    root.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      tracking = true;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
    }, { passive: true });

    root.addEventListener("touchend", function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - x0, dy = t.clientY - y0, dt = Date.now() - t0;
      if (dt > 700) return;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        go(dx < 0 ? 1 : -1);
      } else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.4) {
        close();                       // swipe down to dismiss
      }
    }, { passive: true });
  }

  function render(dir) {
    var p = list[idx];
    if (!p) return;

    var old = imgWrap.firstElementChild;
    if (old) {
      old.classList.add("out");
      old.classList.toggle("out-left", dir > 0);
      setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 520);
    }

    var fig = el("figure", "lb-item");
    if (dir) fig.classList.add(dir > 0 ? "from-right" : "from-left");
    fig.appendChild(core.img(p, "lb-img", true));
    imgWrap.appendChild(fig);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { fig.classList.add("in"); });
    });

    capEl.textContent = p.caption || "";
    capEl.style.visibility = p.caption ? "" : "hidden";
    countEl.textContent = pad(idx + 1) + " / " + pad(list.length);

    var multi = list.length > 1;
    prevBtn.hidden = nextBtn.hidden = !multi;

    // Warm the neighbours so navigation feels instant.
    [idx - 1, idx + 1].forEach(function (i) {
      var n = list[(i + list.length) % list.length];
      if (n) { var w = new Image(); w.src = n.src; }
    });
  }

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function go(dir) {
    if (list.length < 2) return;
    idx = (idx + dir + list.length) % list.length;
    render(dir);
  }

  /* photos: array of core photo objects.  start: index to open at. */
  function show(photos, start) {
    build();
    if (!photos || !photos.length) return;

    list = photos;
    idx = core.clamp(start || 0, 0, list.length - 1);
    lastFocus = document.activeElement;

    root.hidden = false;
    core.lockScroll();
    open = true;
    requestAnimationFrame(function () { root.classList.add("open"); });
    render(0);

    releaseTrap = core.trapFocus(root);
    setTimeout(function () { closeBtn.focus(); }, 60);
  }

  function close() {
    if (!open) return;
    open = false;
    root.classList.remove("open");
    if (releaseTrap) { releaseTrap(); releaseTrap = null; }

    setTimeout(function () {
      root.hidden = true;
      imgWrap.innerHTML = "";
      core.unlockScroll();
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }, env.reduced ? 0 : 380);
  }

  /* Turn any element into a lightbox trigger for a given photo set. */
  function bind(node, photos, index) {
    node.addEventListener("click", function (e) {
      e.preventDefault();
      show(photos, index);
    });
    node.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        show(photos, index);
      }
    });
  }

  NS.lightbox = { show: show, close: close, bind: bind };

})(window.BDAY);
