/* ============================================================================
   PARTICLES  —  one canvas, several emitters, hard particle cap.
   The loop sleeps completely when nothing is alive, so it costs 0% CPU
   for the 95% of the time the page is just sitting there.
   ============================================================================ */
(function (NS) {
  "use strict";

  var core = NS.core, env = core.env;

  var GOLD  = ["#f5c451", "#ffd980", "#ffb35c", "#fff3d0"];
  var PARTY = ["#f5c451", "#f4a9b8", "#b9a7ff", "#a8e0d0", "#ffc9a3", "#fff3d0", "#ff8fa8"];

  var canvas, ctx, dpr = 1, W = 0, H = 0;
  var parts = [], running = false, rafId = 0, lastT = 0;
  var visible = true;

  var CAP = 0;
  function cap() {
    if (env.reduced) return 120;
    return env.lowPower ? 320 : 900;
  }

  function boot() {
    canvas = document.getElementById("fx");
    if (!canvas) return;
    ctx = canvas.getContext("2d", { alpha: true });
    CAP = cap();
    resize();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", function () {
      visible = !document.hidden;
      if (visible && parts.length) kick();
    });
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, env.lowPower ? 1.5 : 2);
    // CSS already sizes the canvas to the viewport; here we only match the
    // backing store to it at the right pixel density.
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CAP = cap();
  }

  function push(p) {
    if (parts.length >= CAP) return;
    parts.push(p);
  }

  function kick() {
    if (running || !ctx) return;
    running = true;
    lastT = performance.now();
    rafId = requestAnimationFrame(step);
  }

  function step(t) {
    var dt = Math.min((t - lastT) / 16.667, 3);   // in frames, clamped after tab-switch
    lastT = t;

    ctx.clearRect(0, 0, W, H);

    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.update(p, dt);
      p.draw(p, ctx);
    }

    if (parts.length && visible) {
      rafId = requestAnimationFrame(step);
    } else {
      running = false;
      ctx.clearRect(0, 0, W, H);
    }
  }

  /* ------------------------------------------------------------ primitives */

  function confettiPiece(x, y, vx, vy, color, life) {
    return {
      x: x, y: y, vx: vx, vy: vy, color: color,
      w: 4 + Math.random() * 7, h: 6 + Math.random() * 10,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.34,
      flip: Math.random() * Math.PI * 2,
      vf: 0.12 + Math.random() * 0.16,
      life: life, max: life,
      update: function (p, dt) {
        p.vy += 0.115 * dt;
        p.vx *= Math.pow(0.992, dt);
        p.vy *= Math.pow(0.995, dt);
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.vr * dt; p.flip += p.vf * dt;
      },
      draw: function (p, c) {
        var a = Math.min(1, p.life / (p.max * 0.35));
        c.save();
        c.globalAlpha = a;
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.scale(1, Math.abs(Math.cos(p.flip)) * 0.9 + 0.1);   // paper flutter
        c.fillStyle = p.color;
        c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        c.restore();
      }
    };
  }

  function spark(x, y, vx, vy, color, life, size) {
    return {
      x: x, y: y, vx: vx, vy: vy, color: color,
      size: size || 2.2, life: life, max: life,
      px: x, py: y,
      update: function (p, dt) {
        p.px = p.x; p.py = p.y;
        p.vy += 0.048 * dt;
        p.vx *= Math.pow(0.965, dt);
        p.vy *= Math.pow(0.965, dt);
        p.x += p.vx * dt; p.y += p.vy * dt;
      },
      draw: function (p, c) {
        var a = p.life / p.max;
        c.save();
        c.globalCompositeOperation = "lighter";
        c.globalAlpha = a;
        c.strokeStyle = p.color;
        c.lineWidth = p.size * a;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(p.px, p.py);
        c.lineTo(p.x, p.y);
        c.stroke();
        c.restore();
      }
    };
  }

  function smokePuff(x, y, drift) {
    var r0 = 5 + Math.random() * 6;
    return {
      x: x, y: y,
      vx: drift + (Math.random() - 0.5) * 0.24,
      vy: -(0.5 + Math.random() * 0.55),
      r: r0, life: 90 + Math.random() * 60, max: 150,
      seed: Math.random() * 100,
      update: function (p, dt) {
        p.vy *= Math.pow(0.995, dt);
        p.x += (p.vx + Math.sin((p.life + p.seed) * 0.035) * 0.28) * dt;
        p.y += p.vy * dt;
        p.r += 0.30 * dt;
      },
      draw: function (p, c) {
        var a = (p.life / p.max) * 0.30;
        var g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, "rgba(214,210,224," + a + ")");
        g.addColorStop(1, "rgba(214,210,224,0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fill();
      }
    };
  }

  function glowDot(x, y, vx, vy, color, life, size) {
    return {
      x: x, y: y, vx: vx, vy: vy, color: color, size: size,
      life: life, max: life,
      update: function (p, dt) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= Math.pow(0.98, dt); p.vy *= Math.pow(0.98, dt);
      },
      draw: function (p, c) {
        var a = p.life / p.max;
        c.save();
        c.globalCompositeOperation = "lighter";
        var g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        g.addColorStop(0, p.color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        c.globalAlpha = a * 0.85;
        c.fillStyle = g;
        c.beginPath(); c.arc(p.x, p.y, p.size, 0, Math.PI * 2); c.fill();
        c.restore();
      }
    };
  }

  /* --------------------------------------------------------------- emitters */

  /* Party cracker: a tight cone of confetti + sparks from one point. */
  function cracker(x, y, angle, power) {
    var n = env.reduced ? 24 : (env.lowPower ? 60 : 110);
    power = power || 1;
    for (var i = 0; i < n; i++) {
      var a = angle + (Math.random() - 0.5) * 0.85;
      var s = (7 + Math.random() * 16) * power;
      push(confettiPiece(
        x, y, Math.cos(a) * s, Math.sin(a) * s,
        PARTY[(Math.random() * PARTY.length) | 0],
        95 + Math.random() * 75
      ));
    }
    var m = env.reduced ? 8 : 34;
    for (var j = 0; j < m; j++) {
      var b = angle + (Math.random() - 0.5) * 0.7;
      var v = (12 + Math.random() * 22) * power;
      push(spark(x, y, Math.cos(b) * v, Math.sin(b) * v,
        GOLD[(Math.random() * GOLD.length) | 0], 26 + Math.random() * 24, 2.6));
    }
    kick();
  }

  /* Firework: shell burst — ring of sparks + a bloom. */
  function firework(x, y, color) {
    var n = env.reduced ? 26 : (env.lowPower ? 54 : 96);
    var hue = color || PARTY[(Math.random() * PARTY.length) | 0];
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 + Math.random() * 0.12;
      var v = 4 + Math.random() * 10;
      push(spark(x, y, Math.cos(a) * v, Math.sin(a) * v, hue, 34 + Math.random() * 30, 2.4));
    }
    push(glowDot(x, y, 0, 0, hue, 16, 90));
    kick();
  }

  /* Confetti rain across the top of the viewport. */
  function rain(amount, duration) {
    var total = env.reduced ? 30 : (env.lowPower ? 90 : amount || 180);
    var per = Math.max(1, Math.round(total / 22));
    var ticks = 0;
    (function drop() {
      for (var i = 0; i < per; i++) {
        push(confettiPiece(
          Math.random() * W, -20 - Math.random() * 120,
          (Math.random() - 0.5) * 3, 3 + Math.random() * 4,
          PARTY[(Math.random() * PARTY.length) | 0],
          200 + Math.random() * 140
        ));
      }
      kick();
      if (++ticks < 22) setTimeout(drop, (duration || 1500) / 22);
    })();
  }

  /* The big one: cracker from both corners + staggered fireworks + rain. */
  function celebrate(originEl) {
    var cx = W / 2, cy = H * 0.56;
    if (originEl) {
      var r = originEl.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
    }

    cracker(cx, cy, -Math.PI / 2, 1.25);
    cracker(-10, H * 0.85, -Math.PI / 4.4, 1.35);
    cracker(W + 10, H * 0.85, -Math.PI + Math.PI / 4.4, 1.35);

    var shots = env.reduced ? 2 : (env.lowPower ? 4 : 8);
    for (var i = 0; i < shots; i++) {
      (function (k) {
        setTimeout(function () {
          firework(
            W * (0.12 + Math.random() * 0.76),
            H * (0.14 + Math.random() * 0.42)
          );
        }, 260 + k * 190);
      })(i);
    }
    setTimeout(function () { rain(200, 2000); }, 380);
  }

  /* A smaller, tasteful burst for the finale — deliberately not endless. */
  function sprinkle(originEl) {
    var cx = W / 2, cy = H * 0.5;
    if (originEl) {
      var r = originEl.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    }
    cracker(cx, cy, -Math.PI / 2, 0.85);
    setTimeout(function () { firework(W * 0.28, H * 0.3); }, 220);
    setTimeout(function () { firework(W * 0.74, H * 0.26); }, 430);
  }

  /* Candle smoke — called with the screen position of each flame. */
  function smoke(x, y) {
    var n = env.reduced ? 5 : 16;
    for (var i = 0; i < n; i++) {
      (function (k) {
        setTimeout(function () {
          push(smokePuff(x + (Math.random() - 0.5) * 6, y, (Math.random() - 0.5) * 0.2));
          kick();
        }, k * 85);
      })(i);
    }
  }

  /* Soft gold embers rising behind the birthday title. */
  function embers(count) {
    var n = env.reduced ? 0 : (env.lowPower ? 14 : count || 30);
    for (var i = 0; i < n; i++) {
      push(glowDot(
        Math.random() * W, H + Math.random() * 60,
        (Math.random() - 0.5) * 0.4, -(0.5 + Math.random() * 0.9),
        GOLD[(Math.random() * GOLD.length) | 0],
        220 + Math.random() * 180, 2 + Math.random() * 4
      ));
    }
    kick();
  }

  function clear() {
    parts.length = 0;
    if (ctx) ctx.clearRect(0, 0, W, H);
  }

  NS.fx = {
    boot: boot, cracker: cracker, firework: firework, rain: rain,
    celebrate: celebrate, sprinkle: sprinkle, smoke: smoke,
    embers: embers, clear: clear,
    get count() { return parts.length; }
  };

})(window.BDAY);
