# 🎂 Her Birthday Site

An interactive, cinematic birthday experience. Opens on a black screen, walks
her through a candle ritual, explodes into confetti, then unfolds into a long
scrolling story built around **your** photos and videos.

Right now it runs with labelled placeholders — every missing photo shows a card
telling you exactly which file it wants. Drop your files in and they disappear.

---

## ⚡ Three things to do

### 1. Put her real name in

Open **`js/config.js`**, line ~60:

```js
subject: {
  name: "Shruti",            // ⚠️  <-- CHANGE THIS
  handle: "septembergirl",  // shown in the fake-feed section
  birthday: "6 September"
}
```

The name is used in about ten places — the explosion title, the letter, the
page title. Changing it here changes all of them.

### 2. Add your photos

Drop them into **`images/`**. Then list them in `js/config.js`:

```js
photos: [
  { src: "images/photo01.jpg", caption: "Exhibit A.", feature: true },
  { src: "images/photo02.jpg", caption: "Creator mode: ON 🎬", portrait: true },
  // ...add as many as you like
]
```

| field      | what it does |
|------------|--------------|
| `src`      | path to the file — name them anything you like |
| `caption`  | shows in the lightbox and on some cards. Keep it short |
| `feature`  | `true` marks it good enough for a full-screen cinematic moment. **Mark 3–5 of your best.** Landscape or square work best here |
| `portrait` | hints that it's a tall photo, so layouts place it better |

**It already works with anything from 6 to 60+ photos.** Every section pulls
from this one list and cycles through it, so you never end up with a half-empty
grid. Add a photo and it shows up across the film strip, the photo wall, the
feed, the masonry archive and the lightbox at once.

**Image specs:** `.jpg` or `.webp` · long edge 1600–2000px · quality ~80% ·
under 400KB each. Mix portrait, landscape and square on purpose — the layouts
are built for mixed shapes. Bulk-compress at [squoosh.app](https://squoosh.app).

### 3. Add your videos

Drop them into **`videos/`**, then:

```js
videos: [
  { src: "videos/video01.mp4", poster: "images/photo01.jpg", caption: "..." }
]
```

Use **.mp4 (H.264 + AAC)** — it plays everywhere. Keep each under ~15MB so it
stays fast on mobile data. `poster` is the still frame shown before play; delete
the line if you don't have one.

---

## 🎵 Optional: the soundtrack

Drop an mp3 at **`audio/birthday-song.mp3`**.

It **never autoplays** — a floating music button appears after the confetti
explosion and she taps it. If the file isn't there, the button quietly removes
itself, which is why you can't see it right now.

---

## ▶️ Running it

Just **double-click `index.html`**. No build step, no `npm install`, no
dependencies. It's plain HTML, CSS and JavaScript.

If you'd rather serve it locally (slightly more accurate to how it'll behave
when deployed):

```bash
npx serve .
```

**To send it to her**, drag this whole folder onto
[app.netlify.com/drop](https://app.netlify.com/drop) — it gives you a link in
about ten seconds. Vercel, GitHub Pages and Cloudflare Pages all work the same
way. Nothing needs configuring.

---

## 📖 What she'll experience

```
BLACK SCREEN → "Ready?" → the ritual → cake appears
      → 3 · 2 · 1 → "Make a wish ✨" → "Now blow 💨"
      → candles out, smoke rises → darkness → "Wish made? 👀" → "Good."
      → 💥 CONFETTI + FIREWORKS + HAPPY BIRTHDAY [NAME]
      → "Now let me show you something I made for you…"
──────────────────────────────────────────────────────────────
  01  Arrival — floating polaroids
  02  A few things I've figured out about you (tilting cards)
  03  Your Unofficial Personality Report (animated meters, ERROR 404)
  04  Things you probably don't know I noticed
  05  ✦ cinematic photo pause — "Anyway..."
  06  The evidence — parallax depth composition
  07  Your world — five categories, each opens a modal
  08  Creator mode: ON — social-feed metaphor
  09  Okay, this deserved motion — the video
  10  Film strip — horizontal contact sheet
  11  The photo wall — scattered scrapbook
  12  One photo at a time — scroll cinema
  13  The archive — masonry + second video
  14  Things I still don't know about you
  15  ✦ cinematic photo pause — "This one deserved its own screen."
  16  🎁 The surprise → the letter → "One Last Thing 👀"
```

She can blow the candles three ways: the **button**, **tapping the candles**, or
**her actual microphone** — and the mic is strictly opt-in. It's never requested
unless she taps "or use your mic", and if she declines or has no mic, the button
and tapping keep working. There's a **skip intro** button and Escape works too.

---

## 🛠 How it's put together

```
index.html          section shells; everything else renders from config
js/
  config.js         ⭐ the only file you need to edit
  core.js           media pool, placeholder system, reveal engine, rAF ticker
  particles.js      canvas: confetti, fireworks, smoke, embers (hard capped)
  intro.js          the opening ritual
  gallery.js        the eight photo treatments
  sections.js       trait cards, meters, observations, modals, mystery
  lightbox.js       full-screen viewer
  video.js          custom cinematic player
  audio.js          floating soundtrack control
  nav.js            pill nav, scroll progress, background moods
  cursor.js         subtle desktop cursor
  finale.js         the surprise, the letter, the coda
  app.js            boot
css/
  base.css          design tokens, typography, backgrounds, nav, cursor
  intro.css         cake, candles, countdown, explosion
  sections.css      content sections + finale
  media.css         photo treatments, lightbox, video
  responsive.css    mobile (designed, not shrunk)
```

**Every photo treatment reads from the same pool.** There is no place where a
filename is hard-coded into a component — that's why adding one line to
`config.js` updates the entire site.

### Details worth knowing

- **Performance.** One shared `requestAnimationFrame` loop drives all the
  scroll effects rather than a scroll listener per section, and element geometry
  is cached so the loop never forces a layout reflow. Images are lazy-loaded,
  the particle canvas caps itself (lower on phones) and sleeps at 0% CPU when
  idle, and offscreen videos are hard-paused.
- **Reduced motion.** `prefers-reduced-motion` strips parallax, floating and
  looping animations and shortens the intro, while keeping every state change
  visible and every control working.
- **Accessibility.** Semantic HTML, real `<button>`s, keyboard support
  throughout, focus trapping in the lightbox and modals, Escape to close,
  visible focus rings, alt text, and the main site is `inert` until the intro
  hands over.
- **Mobile.** Laid out separately, not scaled down: the film strip becomes a
  native swipe, the photo wall restacks, hover-only affordances become always-on,
  and there is zero horizontal overflow at any width.

---

## ✏️ Changing the words

All of it lives in `js/config.js` — the trait cards, the report percentages, the
observations, the five "your world" categories, the mystery cards, and the final
letter (which reveals one line at a time). Edit the strings, reload, done.

The intro lines ("Ready?", "Now blow 💨") are in `js/intro.js`; the section
headings are in `index.html`.
