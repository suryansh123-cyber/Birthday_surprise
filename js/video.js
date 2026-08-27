/* ============================================================================
   VIDEO  —  a cinematic custom player.
   Never autoplays with sound. If a muted preview loop is allowed by the
   browser it plays silently behind the poster; otherwise the poster just sits
   there and nothing looks broken. Sound only ever starts on a real tap.
   ============================================================================ */
(function (NS) {
  "use strict";

  var core = NS.core;
  var $ = core.$, el = core.el, env = core.env, esc = core.esc;

  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ":" + (s < 10 ? "0" + s : s);
  }

  function player(host, spec, opts) {
    opts = opts || {};
    var wrap = el("div", "vid");
    wrap.setAttribute("data-reveal", "");

    var frame = el("div", "vid-frame");
    var v = document.createElement("video");
    v.className = "vid-el";
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    v.preload = "metadata";
    v.muted = true;                       // start muted — required for any preview
    v.loop = !!opts.loop;
    v.src = spec.src;
    if (spec.poster) v.poster = spec.poster;
    v.setAttribute("aria-label", spec.caption || "Video");

    frame.appendChild(v);

    /* Fallback shown when the file is missing or the codec won't play. */
    var miss = el("div", "vid-missing",
      '<span class="vid-missing-icon" aria-hidden="true">🎬</span>' +
      '<p><code>' + esc(spec.src) + '</code></p>' +
      '<p class="vid-missing-sub">Drop this video file in and it appears here.</p>');
    miss.hidden = true;
    frame.appendChild(miss);

    /* ------------------------------------------------------------ controls */
    var big = el("button", "vid-play");
    big.type = "button";
    big.setAttribute("aria-label", "Play video");
    big.innerHTML = '<span class="vid-play-ring" aria-hidden="true"></span>' +
      '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">' +
      '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
    frame.appendChild(big);

    var bar = el("div", "vid-bar");
    bar.innerHTML =
      '<button type="button" class="vid-btn vid-toggle" aria-label="Play">' +
        '<svg class="i-play" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">' +
          '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>' +
        '<svg class="i-pause" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" hidden>' +
          '<path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor"/></svg>' +
      '</button>' +
      '<div class="vid-seek" role="slider" tabindex="0" aria-label="Seek" ' +
           'aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
        '<span class="vid-seek-track"><i class="vid-seek-fill"></i></span>' +
      '</div>' +
      '<span class="vid-time">0:00</span>' +
      '<button type="button" class="vid-btn vid-mute" aria-label="Unmute">' +
        '<svg class="i-muted" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">' +
          '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>' +
          '<path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="1.7" ' +
          'stroke-linecap="round" fill="none"/></svg>' +
        '<svg class="i-loud" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" hidden>' +
          '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>' +
          '<path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" stroke="currentColor" ' +
          'stroke-width="1.7" stroke-linecap="round" fill="none"/></svg>' +
      '</button>' +
      '<button type="button" class="vid-btn vid-full" aria-label="Fullscreen">' +
        '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">' +
          '<path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5" stroke="currentColor" ' +
          'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>' +
      '</button>';
    frame.appendChild(bar);

    wrap.appendChild(frame);
    if (spec.caption) wrap.appendChild(el("p", "vid-cap", esc(spec.caption)));
    host.appendChild(wrap);
    core.observeReveal(wrap);

    var toggle = $(".vid-toggle", bar), muteBtn = $(".vid-mute", bar),
        fullBtn = $(".vid-full", bar), seek = $(".vid-seek", bar),
        fill = $(".vid-seek-fill", bar), timeEl = $(".vid-time", bar);

    /* -------------------------------------------------------------- state */
    var started = false;

    function setPlayIcon(playing) {
      $(".i-play", toggle).hidden = playing;
      $(".i-pause", toggle).hidden = !playing;
      toggle.setAttribute("aria-label", playing ? "Pause" : "Play");
      wrap.classList.toggle("playing", playing);
    }
    function setMuteIcon() {
      $(".i-muted", muteBtn).hidden = !v.muted;
      $(".i-loud", muteBtn).hidden = v.muted;
      muteBtn.setAttribute("aria-label", v.muted ? "Unmute" : "Mute");
    }

    /* First real interaction: unmute and play with sound. */
    function start() {
      started = true;
      wrap.classList.add("started");
      v.muted = false;
      v.loop = false;
      setMuteIcon();
      v.play().catch(function () {
        // Some browsers still refuse; keep it muted rather than failing.
        v.muted = true; setMuteIcon();
        v.play().catch(function () {});
      });
    }

    big.addEventListener("click", function () {
      if (!started) start();
      else if (v.paused) v.play().catch(function () {}); else v.pause();
    });

    toggle.addEventListener("click", function () {
      if (!started) { start(); return; }
      if (v.paused) v.play().catch(function () {}); else v.pause();
    });

    muteBtn.addEventListener("click", function () {
      v.muted = !v.muted;
      if (!v.muted) started = true, wrap.classList.add("started");
      setMuteIcon();
    });

    fullBtn.addEventListener("click", function () {
      var target = frame;
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else if (target.requestFullscreen) {
        target.requestFullscreen().catch(function () {});
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      } else if (v.webkitEnterFullscreen) {
        v.webkitEnterFullscreen();          // iPhone only allows the <video> itself
      }
    });

    v.addEventListener("play",  function () { setPlayIcon(true); });
    v.addEventListener("pause", function () { setPlayIcon(false); });
    v.addEventListener("ended", function () {
      setPlayIcon(false);
      wrap.classList.remove("started");
      started = false;
      v.currentTime = 0;
    });

    v.addEventListener("timeupdate", function () {
      var d = v.duration || 0;
      var p = d ? v.currentTime / d : 0;
      fill.style.transform = "scaleX(" + p.toFixed(4) + ")";
      seek.setAttribute("aria-valuenow", Math.round(p * 100));
      timeEl.textContent = fmt(v.currentTime) + (d ? " / " + fmt(d) : "");
    });

    v.addEventListener("loadedmetadata", function () {
      timeEl.textContent = "0:00 / " + fmt(v.duration);
    });

    v.addEventListener("error", function () {
      miss.hidden = false;
      wrap.classList.add("broken");
    });

    /* Seeking: click, drag, and arrow keys. */
    function seekTo(clientX) {
      var r = seek.getBoundingClientRect();
      var p = core.clamp((clientX - r.left) / r.width, 0, 1);
      if (v.duration) v.currentTime = p * v.duration;
    }
    seek.addEventListener("pointerdown", function (e) {
      seek.setPointerCapture(e.pointerId);
      seekTo(e.clientX);
      seek.classList.add("dragging");
    });
    seek.addEventListener("pointermove", function (e) {
      if (seek.classList.contains("dragging")) seekTo(e.clientX);
    });
    seek.addEventListener("pointerup", function (e) {
      seek.classList.remove("dragging");
      try { seek.releasePointerCapture(e.pointerId); } catch (err) {}
    });
    seek.addEventListener("keydown", function (e) {
      if (!v.duration) return;
      if (e.key === "ArrowRight") { e.preventDefault(); v.currentTime = Math.min(v.duration, v.currentTime + 5); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); v.currentTime = Math.max(0, v.currentTime - 5); }
    });

    setMuteIcon();
    setPlayIcon(false);

    /* ------------------------------------------- visibility-driven preview
       A silent looping preview while on screen (if the browser allows it),
       and a hard pause the moment it scrolls away — no offscreen decoding. */
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            wrap.classList.add("visible");
            if (!started && opts.preview && !env.reduced && !env.lowPower) {
              v.muted = true; v.loop = true;
              v.play().catch(function () {});   // blocked = fine, poster stays
            }
          } else {
            wrap.classList.remove("visible");
            if (!v.paused) v.pause();
          }
        });
      }, { threshold: 0.35 });
      io.observe(wrap);
    }

    return { video: v, wrap: wrap };
  }

  function mount(host, index, opts) {
    var spec = core.videos[index];
    if (!spec) return null;
    return player(host, spec, opts);
  }

  NS.video = { mount: mount, player: player };

})(window.BDAY);
