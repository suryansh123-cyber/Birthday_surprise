/* ============================================================================
   INTRO  —  the cinematic opening ritual.

   black → "Ready?" → cake → 3·2·1 → make a wish → blow → smoke → darkness
        → particle explosion → HAPPY BIRTHDAY → hand-off to the main site

   Scroll is locked for the whole sequence and released exactly once at the end
   (including via Skip, so there is no way to end up stuck).
   ============================================================================ */
(function (NS) {
  "use strict";

  var core = NS.core, fx = NS.fx, cfg = NS.config;
  var $ = core.$, el = core.el, env = core.env;

  var stage, line, cake, root;
  var finished = false;
  var timers = [];
  var mic = null;                 // { stream, ctx, raf } when active
  var blown = false;

  /* Every timeout goes through here so Skip can cancel the whole timeline. */
  function later(fn, ms) {
    var id = setTimeout(function () {
      timers.splice(timers.indexOf(id), 1);
      fn();
    }, ms);
    timers.push(id);
    return id;
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers.length = 0;
  }

  /* Swap the centred line of text with a fade/blur cross-dissolve. */
  function say(html, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var out = line.firstElementChild;
      if (out) {
        out.classList.add("out");
        later(function () { if (out.parentNode) out.parentNode.removeChild(out); }, 620);
      }
      var n = el("p", "intro-line " + (opts.cls || ""), html);
      line.appendChild(n);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { n.classList.add("in"); });
      });
      later(resolve, opts.hold != null ? opts.hold : 1500);
    });
  }

  function setStage(name) {
    root.setAttribute("data-stage", name);
  }

  /* ------------------------------------------------------------------ cake */
  function buildCake() {
    var c = el("div", "cake");
    c.setAttribute("aria-hidden", "true");
    c.innerHTML =
      '<div class="cake-glow"></div>' +
      '<div class="cake-stack">' +
        '<div class="candle-row">' +
          candle(0) + candle(1) + candle(2) +
        '</div>' +
        '<div class="tier tier-top"><span class="drip d1"></span><span class="drip d2"></span>' +
          '<span class="drip d3"></span><span class="drip d4"></span><span class="drip d5"></span></div>' +
        '<div class="tier tier-mid"><span class="drip d1"></span><span class="drip d2"></span>' +
          '<span class="drip d3"></span><span class="drip d4"></span></div>' +
        '<div class="plate"></div>' +
      '</div>';
    return c;
  }

  function candle(i) {
    return '' +
      '<button type="button" class="candle" data-candle="' + i + '" tabindex="-1" ' +
              'aria-label="Blow out candle ' + (i + 1) + '">' +
        '<span class="flame">' +
          '<span class="flame-outer"></span>' +
          '<span class="flame-inner"></span>' +
        '</span>' +
        '<span class="wick"></span>' +
        '<span class="stick"></span>' +
      '</button>';
  }

  /* ------------------------------------------------------- blowing it out */

  function extinguish(candleEl) {
    if (candleEl.classList.contains("out")) return false;
    candleEl.classList.add("out");

    var flame = $(".flame", candleEl);
    var r = flame.getBoundingClientRect();
    fx.smoke(r.left + r.width / 2, r.top + r.height / 2);

    // Fewer flames left → less glow on the cake.
    var left = core.$$(".candle:not(.out)", root).length;
    cake.style.setProperty("--lit", left / 3);
    return true;
  }

  function allOut() {
    return core.$$(".candle", root).every(function (c) {
      return c.classList.contains("out");
    });
  }

  function blowAll() {
    if (blown) return;
    blown = true;
    var candles = core.$$(".candle", root);
    candles.forEach(function (c, i) {
      later(function () { extinguish(c); }, i * 210);
    });
    later(afterBlow, candles.length * 210 + 700);
  }

  function onCandleTap(e) {
    var btn = e.target.closest("[data-candle]");
    if (!btn || blown) return;
    extinguish(btn);
    if (allOut()) {
      blown = true;
      later(afterBlow, 620);
    }
  }

  /* ------------------------------------------------- optional microphone
     Never requested up front. Only when she explicitly taps "use my mic".
     Denial is a no-op — the tap-and-button path always remains.            */
  function startMic(btn) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      btn.textContent = "mic not available here — just tap 💨";
      btn.disabled = true;
      return;
    }
    btn.textContent = "listening… 🎤";
    btn.disabled = true;

    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var AC = window.AudioContext || window.webkitAudioContext;
      var actx = new AC();
      var src = actx.createMediaStreamSource(stream);
      var an = actx.createAnalyser();
      an.fftSize = 1024;
      an.smoothingTimeConstant = 0.55;
      src.connect(an);

      var buf = new Uint8Array(an.frequencyBinCount);
      var loud = 0;
      mic = { stream: stream, ctx: actx, raf: 0 };
      btn.textContent = "blow into your mic 💨";

      (function listen() {
        if (blown) return stopMic();
        an.getByteFrequencyData(buf);
        // Blowing is broadband low-mid noise — sample that band, not a peak.
        var sum = 0, lo = 2, hi = Math.min(buf.length, 60);
        for (var i = lo; i < hi; i++) sum += buf[i];
        var avg = sum / (hi - lo);

        loud = avg > 62 ? loud + 1 : 0;   // must sustain ~5 frames
        if (loud > 5) { stopMic(); blowAll(); return; }

        mic.raf = requestAnimationFrame(listen);
      })();
    }).catch(function () {
      // Denied or unavailable — completely fine, nothing breaks.
      btn.textContent = "no mic? just tap the button 👇";
      btn.disabled = true;
    });
  }

  function stopMic() {
    if (!mic) return;
    cancelAnimationFrame(mic.raf);
    try { mic.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    try { mic.ctx.close(); } catch (e) {}
    mic = null;
  }

  /* ------------------------------------------------------------- timeline */

  function afterBlow() {
    stopMic();
    setStage("dark");
    $(".blow-ui", root).classList.remove("show");

    later(function () {
      say("Wish made? 👀", { hold: 1500 }).then(function () {
        return say("Good.", { hold: 1350, cls: "big" });
      }).then(function () {
        line.innerHTML = "";
        later(explode, 520);
      });
    }, 900);
  }

  function explode() {
    setStage("boom");

    var title = $(".boom-title", root);
    title.hidden = false;

    // Typography emerges *out of* the burst, so fire particles slightly first.
    fx.celebrate(title);
    if (!env.reduced) fx.embers(26);

    requestAnimationFrame(function () { title.classList.add("in"); });

    // Music becomes available (still never auto-plays) once we're celebrating.
    if (NS.audio && NS.audio.promote) NS.audio.promote();

    later(function () {
      var sub = $(".boom-sub", root);
      sub.hidden = false;
      requestAnimationFrame(function () { sub.classList.add("in"); });
    }, 1500);

    later(function () {
      // Hands row 2 to the title and drops the closing lines into row 3,
      // so the name and the text never share the same band.
      setStage("outro");
      say("Okay, now the actual surprise starts…", { hold: 1750 }).then(function () {
        return say("Now let me show you something I made for you…", { hold: 1900 });
      }).then(handoff);
    }, 3100);
  }

  function handoff() {
    if (finished) return;
    finished = true;
    clearTimers();
    stopMic();

    setStage("exit");
    document.body.classList.add("site-ready");

    // Fade the overlay out, then remove it from the DOM entirely.
    later(function () {
      core.unlockScroll();
      window.scrollTo(0, 0);
      root.classList.add("gone");
      later(function () {
        if (root.parentNode) root.parentNode.removeChild(root);
        fx.clear();
        document.body.classList.add("intro-done");
        window.dispatchEvent(new CustomEvent("bday:intro-done"));
      }, 1250);
    }, 900);
  }

  function skip() {
    if (finished) return;
    clearTimers();
    stopMic();
    core.$$(".candle", root).forEach(function (c) { c.classList.add("out"); });
    blown = true;
    fx.clear();
    handoff();
  }

  /* ----------------------------------------------------------------- boot */
  function run() {
    root = $("#intro");
    if (!root) return;

    stage = $(".intro-stage", root);
    line  = $(".intro-lines", root);

    cake = buildCake();
    stage.appendChild(cake);

    core.lockScroll();
    setStage("black");

    $(".intro-skip", root).addEventListener("click", skip);
    stage.addEventListener("click", onCandleTap);

    var blowBtn = $(".btn-blow", root);
    var micBtn  = $(".btn-mic", root);
    blowBtn.addEventListener("click", blowAll);
    micBtn.addEventListener("click", function () { startMic(micBtn); });

    // Escape skips too — a stuck full-screen overlay is the worst failure mode.
    document.addEventListener("keydown", function onEsc(e) {
      if (e.key === "Escape" && !finished) { skip(); }
      if (finished) document.removeEventListener("keydown", onEsc);
    });

    var beat = env.reduced ? 0.55 : 1;   // reduced motion → brisker, less waiting
    var T = function (ms) { return Math.round(ms * beat); };

    later(function () {
      say("Ready?", { hold: T(1600), cls: "big" })
        .then(function () { return say("Okay… one tiny birthday ritual first 👀", { hold: T(2000) }); })
        .then(function () { return say("Blow the candles when I say.", { hold: T(1500) }); })
        .then(function () {
          line.innerHTML = "";
          setStage("cake");
          cake.style.setProperty("--lit", "1");
          return core.wait(T(1500));
        })
        .then(countdown);
    }, T(700));
  }

  function countdown() {
    var beat = env.reduced ? 0.6 : 1;
    var T = function (ms) { return Math.round(ms * beat); };

    setStage("count");
    var wish = $(".wish-line", root);
    wish.hidden = false;
    requestAnimationFrame(function () { wish.classList.add("in"); });

    var nums = ["3", "2", "1"];
    var box = $(".countdown", root);

    nums.forEach(function (n, i) {
      later(function () {
        var d = el("span", "count-num", n);
        box.appendChild(d);
        requestAnimationFrame(function () { d.classList.add("in"); });
        later(function () {
          d.classList.add("out");
          later(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 500);
        }, T(760));

        if (n === "1") cake.classList.add("bright");   // flames flare on "1"
      }, i * T(950));
    });

    later(function () {
      wish.classList.remove("in");
      later(function () { wish.hidden = true; }, 500);
      setStage("blow");
      $(".blow-ui", root).classList.add("show");
      say("Now blow 💨", { hold: 0, cls: "big" });
    }, T(950) * 3 + T(250));
  }

  NS.intro = { run: run, skip: skip };

})(window.BDAY);
