/* ============================================================================
   SECTIONS  —  personality cards, the report meters, observations,
   "her world" modals, and the mystery cards.
   ============================================================================ */
(function (NS) {
  "use strict";

  var core = NS.core, cfg = NS.config, gal = NS.gallery, lb = NS.lightbox;
  var $ = core.$, $$ = core.$$, el = core.el, env = core.env, esc = core.esc;

  /* --------------------------------------------------- pointer-tilt cards */
  /* Subtle: max ~7deg, spring-damped, and a light highlight that follows the
     cursor. Disabled entirely on touch and reduced-motion.                  */
  function makeTiltable(node, max) {
    if (env.touch || env.reduced) return;
    max = max || 7;
    var raf = 0, tx = 0, ty = 0, cx = 0, cy = 0, active = false;

    function frame() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      node.style.setProperty("--rx", (-cy * max).toFixed(2) + "deg");
      node.style.setProperty("--ry", (cx * max).toFixed(2) + "deg");
      node.style.setProperty("--mx", (50 + cx * 40).toFixed(1) + "%");
      node.style.setProperty("--my", (50 + cy * 40).toFixed(1) + "%");
      if (active || Math.abs(cx - tx) > 0.001 || Math.abs(cy - ty) > 0.001) {
        raf = requestAnimationFrame(frame);
      } else { raf = 0; }
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }

    node.addEventListener("pointermove", function (e) {
      var r = node.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      active = true; kick();
    });
    node.addEventListener("pointerenter", function () { node.classList.add("hot"); });
    node.addEventListener("pointerleave", function () {
      node.classList.remove("hot");
      tx = ty = 0; active = false; kick();
    });
  }

  /* Buttons that lean toward the cursor when it gets close. */
  function magnetic(btn, strength) {
    if (env.touch || env.reduced) return;
    strength = strength || 0.28;
    var raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;

    function frame() {
      cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
      btn.style.transform = "translate(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px)";
      if (Math.abs(cx - tx) > 0.05 || Math.abs(cy - ty) > 0.05) raf = requestAnimationFrame(frame);
      else { btn.style.transform = "translate(" + tx + "px," + ty + "px)"; raf = 0; }
    }
    btn.addEventListener("pointermove", function (e) {
      var r = btn.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * strength;
      ty = (e.clientY - (r.top + r.height / 2)) * strength;
      if (!raf) raf = requestAnimationFrame(frame);
    });
    btn.addEventListener("pointerleave", function () {
      tx = ty = 0;
      if (!raf) raf = requestAnimationFrame(frame);
    });
  }

  /* ============================================ 1. THINGS I'VE FIGURED OUT */
  function traits(host) {
    var grid = el("div", "traits");

    cfg.traits.forEach(function (t, i) {
      var c = el("article", "trait tint-" + (t.tint || "rose"));
      c.setAttribute("data-reveal", "");
      c.style.setProperty("--i", i);

      var inner = el("div", "trait-in");
      inner.innerHTML =
        '<span class="trait-glow" aria-hidden="true"></span>' +
        '<span class="trait-icon" aria-hidden="true">' + t.icon + '</span>' +
        '<h3 class="trait-title">' + esc(t.title) + '</h3>' +
        '<p class="trait-body">' + esc(t.body) + '</p>';

      // Only some cards get a photo — a photo on every card looks like a grid.
      if (t.photo != null && core.photos[t.photo]) {
        var p = core.photos[t.photo];
        var thumb = el("button", "trait-photo");
        thumb.type = "button";
        thumb.setAttribute("aria-label", "Open photo" + (p.caption ? ": " + p.caption : ""));
        thumb.appendChild(core.img(p, "trait-photo-img"));
        lb.bind(thumb, [p], 0);
        inner.appendChild(thumb);
        c.classList.add("has-photo");
      }

      c.appendChild(inner);
      makeTiltable(c, 6);
      grid.appendChild(c);
    });

    host.appendChild(grid);
    core.observeReveal(grid);
  }

  /* =================================================== 2. THE REPORT METERS */
  function report(host) {
    var list = el("div", "meters");

    cfg.metrics.forEach(function (m, i) {
      var row = el("div", "meter" + (m.glitch ? " glitch" : ""));
      row.setAttribute("data-reveal", "");
      row.style.setProperty("--i", i);
      row.innerHTML =
        '<span class="meter-icon" aria-hidden="true">' + m.icon + '</span>' +
        '<span class="meter-label">' + esc(m.label) + '</span>' +
        '<span class="meter-track"><i class="meter-fill" style="--to:' + (m.glitch ? 100 : m.value) + '%"></i></span>' +
        '<span class="meter-value" data-to="' + m.value + '">' +
          (m.glitch ? '<span class="err" data-text="ERROR 404">ERROR 404</span>' : '0%') +
        '</span>';
      list.appendChild(row);
    });

    var note = el("p", "meters-note",
      "These completely scientific results are based on highly questionable research 😂");
    list.appendChild(note);
    host.appendChild(list);

    /* Count the numbers up once, when the block first scrolls into view. */
    if (!("IntersectionObserver" in window)) {
      $$(".meter", list).forEach(function (r) { r.classList.add("run"); });
      $$(".meter-value", list).forEach(function (v) {
        if (!v.querySelector(".err")) v.textContent = v.dataset.to + "%";
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        runMeters(list);
      });
    }, { threshold: 0.35 });
    io.observe(list);

    core.observeReveal(list);
  }

  function runMeters(list) {
    $$(".meter", list).forEach(function (row, i) {
      setTimeout(function () {
        row.classList.add("run");
        var v = $(".meter-value", row);
        if (v.querySelector(".err")) return;

        var to = parseInt(v.dataset.to, 10) || 0;
        if (env.reduced) { v.textContent = to + "%"; return; }

        var t0 = performance.now(), dur = 1150;
        (function tick(now) {
          var p = core.clamp((now - t0) / dur, 0, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          v.textContent = Math.round(to * eased) + "%";
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      }, i * 130);
    });
  }

  /* ==================================================== 3. THINGS I NOTICED */
  function noticed(host) {
    var wrap = el("div", "notes");
    cfg.noticed.forEach(function (text, i) {
      var n = el("blockquote", "note");
      n.setAttribute("data-reveal", "");
      n.style.setProperty("--i", i);
      n.innerHTML = '<span class="note-mark" aria-hidden="true">' + core.esc(String(i + 1).padStart(2, "0")) + '</span>' +
                    '<p>' + esc(text) + '</p>';
      wrap.appendChild(n);
    });
    host.appendChild(wrap);
    core.observeReveal(wrap);
  }

  /* ======================================================== 4. HER WORLD */
  var modal = null, modalRelease = null, modalLast = null;

  function buildModal() {
    if (modal) return;
    modal = el("div", "modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.hidden = true;
    modal.innerHTML =
      '<div class="modal-backdrop"></div>' +
      '<div class="modal-panel" tabindex="-1">' +
        '<button type="button" class="modal-close" aria-label="Close">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
          '<path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.7" ' +
          'stroke-linecap="round" fill="none"/></svg></button>' +
        '<div class="modal-body"></div>' +
      '</div>';
    document.body.appendChild(modal);

    $(".modal-backdrop", modal).addEventListener("click", closeModal);
    $(".modal-close", modal).addEventListener("click", closeModal);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });
  }

  function openModal(item) {
    buildModal();
    modalLast = document.activeElement;

    var body = $(".modal-body", modal);
    var set = core.pick(item.photos || 3, (item.key.length * 3) % Math.max(1, core.photos.length));

    body.innerHTML =
      '<span class="modal-icon" aria-hidden="true">' + item.icon + '</span>' +
      '<h3 class="modal-title" id="modal-title">' + esc(item.title) + '</h3>' +
      '<p class="modal-lede">' + esc(item.body) + '</p>' +
      '<p class="modal-extra">' + esc(item.extra || "") + '</p>';
    modal.setAttribute("aria-labelledby", "modal-title");

    var strip = el("div", "modal-photos");
    set.forEach(function (p, i) {
      var c = gal.card(p, set, i, "modal-photo");
      c.style.setProperty("--i", i);
      strip.appendChild(c);
    });
    body.appendChild(strip);

    modal.hidden = false;
    core.lockScroll();
    requestAnimationFrame(function () { modal.classList.add("open"); });
    modalRelease = core.trapFocus(modal);
    setTimeout(function () { $(".modal-close", modal).focus(); }, 60);
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.classList.remove("open");
    if (modalRelease) { modalRelease(); modalRelease = null; }
    setTimeout(function () {
      modal.hidden = true;
      $(".modal-body", modal).innerHTML = "";
      core.unlockScroll();
      if (modalLast && modalLast.focus) modalLast.focus();
    }, env.reduced ? 0 : 340);
  }

  function world(host) {
    var grid = el("div", "world");
    cfg.world.forEach(function (item, i) {
      var b = el("button", "world-card");
      b.type = "button";
      b.setAttribute("data-reveal", "fade");   // owns its tilt transform
      b.style.setProperty("--i", i);
      b.innerHTML =
        '<span class="world-glow" aria-hidden="true"></span>' +
        '<span class="world-icon" aria-hidden="true">' + item.icon + '</span>' +
        '<span class="world-title">' + esc(item.title) + '</span>' +
        '<span class="world-hint">open <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">' +
          '<path d="M7 17L17 7M9 7h8v8" stroke="currentColor" stroke-width="1.8" ' +
          'stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></span>';
      b.addEventListener("click", function () { openModal(item); });
      makeTiltable(b, 5);
      grid.appendChild(b);
    });
    host.appendChild(grid);
    core.observeReveal(grid);
  }

  /* ========================================================= 5. MYSTERY */
  function mystery(host) {
    var grid = el("div", "mysteries");
    cfg.mysteries.forEach(function (m, i) {
      var c = el("article", "myst");
      c.setAttribute("data-reveal", "fade");   // owns its tilt transform
      c.style.setProperty("--i", i);
      c.innerHTML =
        '<span class="myst-icon" aria-hidden="true">' + m.icon + '</span>' +
        '<h3 class="myst-title">' + esc(m.title) + '</h3>' +
        '<p class="myst-status"><span class="myst-pulse" aria-hidden="true"></span>' +
          esc(m.status) + '</p>';
      makeTiltable(c, 5);
      grid.appendChild(c);
    });
    host.appendChild(grid);
    core.observeReveal(grid);
  }

  NS.sections = {
    traits: traits, report: report, noticed: noticed,
    world: world, mystery: mystery,
    makeTiltable: makeTiltable, magnetic: magnetic
  };

})(window.BDAY);
