/* ============================================================================
   FINALE  —  the surprise button, the letter that reveals one line at a time,
   and the "one last thing" coda.
   Reveals happen in place (no scroll lock, no modal) so she can always scroll
   back up and re-read. The page gently follows each new line into view.
   ============================================================================ */
(function (NS) {
  "use strict";

  var core = NS.core, cfg = NS.config, fx = NS.fx, sect = NS.sections;
  var $ = core.$, el = core.el, env = core.env, esc = core.esc;

  var opened = false, codaOpen = false;

  /* Keeps the newest line above the fold — and above the fixed nav pill,
     which owns roughly the bottom 70px of the viewport. */
  var PILL_CLEARANCE = 150;

  function nudgeIntoView(node) {
    if (env.reduced) return;
    var r = node.getBoundingClientRect();
    if (r.bottom > window.innerHeight - PILL_CLEARANCE) {
      window.scrollBy({
        top: r.bottom - window.innerHeight + PILL_CLEARANCE,
        behavior: "smooth"
      });
    }
  }

  /* Reveal a line: fade + rise + a soft blur burn-in. Returns a promise. */
  function revealLine(host, html, cls, delay) {
    return new Promise(function (resolve) {
      var p = el("p", "rev " + (cls || ""), html);
      host.appendChild(p);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          p.classList.add("in");
          nudgeIntoView(p);
        });
      });
      setTimeout(resolve, env.reduced ? 120 : (delay || 1150));
    });
  }

  function openSurprise(btn, host) {
    if (opened) return;
    opened = true;

    btn.classList.add("used");
    btn.disabled = true;

    fx.sprinkle(btn);

    var stage = $(".letter", host);
    stage.hidden = false;
    host.classList.add("open");

    setTimeout(function () { btn.parentNode.classList.add("gone"); }, 620);

    var name = cfg.subject.name;

    setTimeout(function () {
      revealLine(stage, "Happy Birthday, " + esc(name) + " ❤️", "letter-head", env.reduced ? 120 : 1500)
        .then(function () {
          // Each paragraph lands on its own beat — never dumped at once.
          return cfg.letter.reduce(function (chain, text, i) {
            return chain.then(function () {
              var last = i === cfg.letter.length - 1;
              return revealLine(
                stage, esc(text),
                "letter-line" + (last ? " letter-sign" : ""),
                env.reduced ? 120 : (last ? 1400 : 1650)
              );
            });
          }, Promise.resolve());
        })
        .then(function () {
          var wrap = $(".coda-launch", host);
          wrap.hidden = false;
          requestAnimationFrame(function () { wrap.classList.add("in"); });
          nudgeIntoView(wrap);
        });
    }, 700);
  }

  function openCoda(btn, host) {
    if (codaOpen) return;
    codaOpen = true;

    btn.disabled = true;
    btn.classList.add("used");
    setTimeout(function () { btn.parentNode.classList.add("gone"); }, 560);

    var stage = $(".coda", host);
    stage.hidden = false;
    host.classList.add("coda-open");

    var name = cfg.subject.name;

    setTimeout(function () {
      revealLine(stage, "Okay, now go enjoy your birthday.", "coda-line", env.reduced ? 120 : 2100)
        .then(function () {
          return revealLine(
            stage,
            "And yes… you were right. Cute surprises are actually pretty nice. 😂",
            "coda-line", env.reduced ? 120 : 2000
          );
        })
        .then(function () {
          return revealLine(
            stage,
            "🎂 Happy Birthday once again, " + esc(name) + ".",
            "coda-final", env.reduced ? 120 : 900
          );
        })
        .then(function () {
          // One last gentle flourish, then the page is allowed to go quiet.
          if (!env.reduced) {
            fx.embers(18);
            setTimeout(function () { fx.firework(window.innerWidth * 0.5, window.innerHeight * 0.32); }, 500);
          }
          host.classList.add("settled");
          var end = $(".the-end", host);
          if (end) {
            end.hidden = false;
            requestAnimationFrame(function () { end.classList.add("in"); });
          }
        });
    }, 620);
  }

  function boot() {
    var host = $("#finale");
    if (!host) return;

    var openBtn = $(".btn-surprise", host);
    var codaBtn = $(".btn-coda", host);

    sect.magnetic(openBtn, 0.3);
    sect.magnetic(codaBtn, 0.3);

    openBtn.addEventListener("click", function () { openSurprise(openBtn, host); });
    codaBtn.addEventListener("click", function () { openCoda(codaBtn, host); });
  }

  NS.finale = { boot: boot };

})(window.BDAY);
