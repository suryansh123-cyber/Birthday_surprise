/* ============================================================================
   AUDIO  —  the floating soundtrack control.
   Never autoplays. Stays hidden until the birthday explosion, then slides in.
   If /audio/birthday-song.mp3 is missing, the control quietly removes itself.
   ============================================================================ */
(function (NS) {
  "use strict";

  var core = NS.core, cfg = NS.config;
  var $ = core.$, el = core.el, env = core.env;

  var a = null, ui = null, bars = null, slider = null, playing = false;
  var ok = true;

  function build() {
    a = new Audio();
    a.loop = true;
    /* "metadata" fetches only the file header (a few KB), never the audio
       itself — enough to know whether the file exists. Unlike a fetch() probe
       this also works on file://, so opening index.html by double-clicking
       behaves the same as a hosted copy. */
    a.preload = "metadata";
    a.volume = cfg.audio.volume != null ? cfg.audio.volume : 0.45;
    a.src = cfg.audio.src;

    a.addEventListener("error", function () {
      ok = false;
      if (ui) ui.remove();
    });

    ui = el("div", "music");
    ui.innerHTML =
      '<button type="button" class="music-btn" aria-pressed="false">' +
        '<span class="music-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
        '<span class="music-label">Play soundtrack</span>' +
      '</button>' +
      '<div class="music-extra">' +
        '<button type="button" class="music-mute" aria-label="Mute soundtrack">' +
          '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">' +
          '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>' +
          '<path class="m-on" d="M16.5 8.5a5 5 0 010 7" stroke="currentColor" stroke-width="1.7" ' +
          'stroke-linecap="round" fill="none"/>' +
          '<path class="m-off" d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="1.7" ' +
          'stroke-linecap="round" fill="none" hidden/></svg>' +
        '</button>' +
        '<input type="range" class="music-vol" min="0" max="100" value="' +
          Math.round((cfg.audio.volume || 0.45) * 100) + '" aria-label="Soundtrack volume">' +
      '</div>';
    document.body.appendChild(ui);

    var btn = $(".music-btn", ui);
    var muteBtn = $(".music-mute", ui);
    slider = $(".music-vol", ui);
    bars = $(".music-eq", ui);

    btn.addEventListener("click", toggle);

    muteBtn.addEventListener("click", function () {
      a.muted = !a.muted;
      $(".m-on", muteBtn).hidden = a.muted;
      $(".m-off", muteBtn).hidden = !a.muted;
      muteBtn.setAttribute("aria-label", a.muted ? "Unmute soundtrack" : "Mute soundtrack");
      ui.classList.toggle("muted", a.muted);
    });

    slider.addEventListener("input", function () {
      a.volume = slider.value / 100;
      if (a.muted && a.volume > 0) {
        a.muted = false;
        $(".m-on", muteBtn).hidden = false;
        $(".m-off", muteBtn).hidden = true;
        ui.classList.remove("muted");
      }
    });

    a.addEventListener("playing", function () { setState(true); });
    a.addEventListener("pause",   function () { setState(false); });
  }

  function setState(on) {
    playing = on;
    if (!ui) return;
    ui.classList.toggle("on", on);
    var btn = $(".music-btn", ui);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    $(".music-label", btn).textContent = on ? "Playing" : "Play soundtrack";
  }

  function toggle() {
    if (!a) return;
    if (playing) { a.pause(); return; }
    a.play().then(function () { setState(true); })
            .catch(function () { setState(false); });
  }

  /* Called by the intro once the celebration fires — the control fades up
     from nothing rather than sitting there during the black-screen opening. */
  function promote() {
    if (!ui || !ok) return;
    ui.classList.add("show");
  }

  function boot() {
    build();
    /* The metadata preload above resolves availability on its own: a missing
       or unplayable file fires `error` and removes the button before she ever
       sees it. Nothing else to do here. */
  }

  NS.audio = { boot: boot, promote: promote, toggle: toggle };

})(window.BDAY);
