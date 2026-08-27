/* ============================================================================
   APP  —  boots everything and renders the data-driven sections.
   ============================================================================ */
(function (NS) {
  "use strict";

  var core = NS.core, cfg = NS.config, gal = NS.gallery, sect = NS.sections;
  var $ = core.$, $$ = core.$$, env = core.env;

  function fillNames() {
    var name = cfg.subject.name || "you";
    $$("[data-name]").forEach(function (n) { n.textContent = name; });
    document.title = "Happy Birthday, " + name + " ✨";
  }

  function splitHeadings() {
    $$("[data-split]").forEach(function (h) {
      // Preserve inline <em data-name> — only split plain-text headings.
      if (h.querySelector("[data-name]")) return;
      core.splitWords(h);
    });
  }

  function buildSections() {
    /* 01 arrival */
    gal.polaroids($(".hello-photos"), env.small ? 4 : 5);

    /* 02–04 content */
    sect.traits($(".traits-host"));
    sect.report($(".report-host"));
    sect.noticed($(".noticed-host"));

    /* 05 cinematic pause one */
    gal.cinematic($("#pause1"), core.feature(0), {
      pre: "Anyway...",
      post: "You do have a pretty good camera roll though."
    });

    /* 06 the evidence */
    gal.evidence($("#evidence"));

    /* 07–08 */
    sect.world($(".world-host"));
    gal.feed($(".feed-host"), cfg.subject.handle);

    /* 09 the feature video */
    NS.video.mount($(".video-host"), 0, { preview: true });

    /* 10 film strip */
    gal.filmstrip($("#strip"), Math.min(18, Math.max(8, core.photos.length)));

    /* 11 photo wall */
    gal.wall($(".wall-host"));

    /* 12 one photo at a time */
    gal.stills($("#stills"), env.small ? 4 : 5);

    /* 13 archive — second video (if provided) then the masonry grid */
    if (core.videos.length > 1) NS.video.mount($(".archive-video-host"), 1, { preview: false });
    gal.masonry($(".archive-host"), Math.min(24, Math.max(9, core.photos.length)));

    /* 14 mystery */
    sect.mystery($(".mystery-host"));

    /* 15 cinematic pause two */
    gal.cinematic($("#pause2"), core.feature(1), {
      pre: "Okay wait...",
      post: "This one deserved its own screen."
    });
  }

  /* Warn in the console (not on the page) if the config still has the
     placeholder name — easy to miss otherwise. */
  function nameCheck() {
    var n = (cfg.subject.name || "").trim();
    if (!n || /^\[.*\]$/.test(n) || n.toLowerCase() === "her name") {
      console.warn(
        "%c⚠  Set her real name in js/config.js → subject.name",
        "background:#f5c451;color:#08070a;padding:4px 10px;border-radius:4px;font-weight:700"
      );
    }
  }

  function boot() {
    nameCheck();
    fillNames();
    splitHeadings();

    NS.fx.boot();
    NS.audio.boot();

    buildSections();

    core.initReveal();
    NS.nav.boot();
    NS.cursor.boot();
    NS.finale.boot();

    /* The main site is inert (and hidden from screen readers) until the
       opening ritual hands over. */
    window.addEventListener("bday:intro-done", function () {
      var site = document.getElementById("site");
      site.removeAttribute("aria-hidden");
      site.removeAttribute("inert");
      document.body.classList.remove("pre-intro");
      core.invalidateGeometry();      // sticky sections now have real heights
    }, { once: true });

    NS.intro.run();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})(window.BDAY);
