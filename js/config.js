/* ============================================================================
   CONFIG.JS  —  THE ONLY FILE YOU NEED TO EDIT
   ============================================================================

   Everything personal lives here: her name, the photo list, the video list,
   the soundtrack, and every caption.

   HOW TO ADD PHOTOS
   -----------------
   1. Drop your files into  /images/   (name them anything you like)
   2. Add a line to the `photos` array below:
          { src: "images/photo07.jpg", caption: "your caption" }
   3. That's it. Every section of the site pulls from this one array,
      so a new photo automatically appears across all the treatments
      (film strip, photo wall, feed, masonry, parallax, lightbox...).

   The site works with as few as 6 photos and as many as 60+.
   Sections cycle through the pool automatically, so you never get a
   broken/empty grid no matter how many you add.

   Any file that is missing is replaced at runtime by a clearly-labelled
   placeholder card telling you which filename it expected. Nothing breaks.

   RECOMMENDED IMAGE SPECS
   -----------------------
   Format:      .jpg  (or .webp for ~30% smaller files — both supported)
   Long edge:   1600–2000px  (bigger than this is wasted; it only slows things down)
   Quality:     ~80%
   File size:   aim for under 400KB each
   Mix:         portrait + landscape + square all look good — the layouts
                are built to handle mixed aspect ratios on purpose.

   Quick way to compress a whole folder: squoosh.app (drag & drop, free)

   ============================================================================ */

window.BDAY = window.BDAY || {};

BDAY.config = {

  /* ==========================================================================
     1. HER  —  ⚠️  CHANGE THE NAME HERE. It is used everywhere on the site.
     ========================================================================== */
  subject: {
    name: "Shruti",              // ⚠️  <-- PUT HER REAL NAME HERE
    handle: "septembergirl",    // used in the fake-feed section (no @ needed)
    birthday: "6 September"
  },


  /* ==========================================================================
     2. PHOTOS
     --------------------------------------------------------------------------
     `caption`  shows in the lightbox + on some cards. Keep them short.
     `feature`  (optional, true/false) marks a photo as good enough for a
                full-screen cinematic moment. Mark 3–5 of your best ones.
                Ideally choose LANDSCAPE or square photos for these.
     `portrait` (optional) hints the layout engine this is a tall photo.
                Purely cosmetic — layouts survive without it.
     ========================================================================== */
  photos: [
    { src: "images/photo01.jpg", caption: "Exhibit A.", feature: true },
    { src: "images/photo02.jpg", caption: "Creator mode: ON 🎬", portrait: true },
    { src: "images/photo03.jpg", caption: "No thoughts. Just vibes." },
    { src: "images/photo04.jpg", caption: "Certified chatpati 🌶️", portrait: true },
    { src: "images/photo05.jpg", caption: "This one's staying, sorry.", feature: true },
    { src: "images/photo06.jpg", caption: "Song stuck in your head, clearly 🎵" },
    { src: "images/photo07.jpg", caption: "Seedhi? Sure. 😇", portrait: true },
    { src: "images/photo08.jpg", caption: "The camera roll is undefeated." },
    { src: "images/photo09.jpg", caption: "Main character energy, unfortunately.", feature: true },
    { src: "images/photo10.jpg", caption: "Zero notes.", portrait: true },
    { src: "images/photo11.jpg", caption: "Reel #47 loading…" },
    { src: "images/photo12.jpg", caption: "Okay this one is unfair." },
    { src: "images/photo13.jpg", caption: "Filed under: evidence.", portrait: true },
    { src: "images/photo14.jpg", caption: "Casual. Very casual." },
    { src: "images/photo15.jpg", caption: "Punjabi song playing in her head 🎧", feature: true },
    { src: "images/photo16.jpg", caption: "Not staged. Allegedly.", portrait: true },
    { src: "images/photo17.jpg", caption: "The little humans were right." },
    { src: "images/photo18.jpg", caption: "September's whole personality." },
    { src: "images/photo19.jpg", caption: "Screenshot-worthy.", portrait: true },
    { src: "images/photo20.jpg", caption: "Adding this to the archive." },
    { src: "images/photo21.jpg", caption: "Chaos, but make it aesthetic." },
    { src: "images/photo22.jpg", caption: "Yeah, this had to be here 😂", feature: true },
    { src: "images/photo23.jpg", caption: "Golden hour agrees with you.", portrait: true },
    { src: "images/photo24.jpg", caption: "Certified troublemaker 😂" },
    { src: "images/photo25.jpg", caption: "The internet keeping up, barely." },
    { src: "images/photo26.jpg", caption: "Frame this one.", portrait: true },
    { src: "images/photo27.jpg", caption: "Still no notes." },
    { src: "images/photo28.jpg", caption: "Peak September girl ✨" }

    /* 👉 ADD MORE HERE — just copy a line and change the filename.
       { src: "images/photo29.jpg", caption: "..." },
       { src: "images/photo30.jpg", caption: "..." },
    */
  ],


  /* ==========================================================================
     3. VIDEOS
     --------------------------------------------------------------------------
     Drop .mp4 files into /videos/.  H.264 + AAC plays everywhere.
     Keep them under ~15MB each so the page stays fast on mobile data.
     `poster` is optional — a still frame shown before play. If you don't
     have one, delete the line and a designed placeholder is used instead.
     ========================================================================== */
  videos: [
    {
      src: "videos/video01.mp4",
      poster: "images/photo01.jpg",
      caption: "Yeah, a screenshot wasn't going to cover this one."
    },
    {
      src: "videos/video02.mp4",
      poster: "images/photo05.jpg",
      caption: "Proof that your camera roll is probably 90% chaos 😂"
    }
  ],


  /* ==========================================================================
     4. SOUNDTRACK
     --------------------------------------------------------------------------
     Drop an .mp3 into /audio/. It NEVER autoplays — she taps to start it.
     If the file is missing, the music button quietly hides itself.
     ========================================================================== */
  audio: {
    src: "audio/birthday-song.mp3",
    title: "birthday soundtrack",
    volume: 0.45
  },


  /* ==========================================================================
     5. THE PERSONALITY CARDS
     `photo` is an index into the photos array above (0 = first photo).
     Set it to null for no photo on that card.
     ========================================================================== */
  traits: [
    {
      icon: "🎬", title: "Creator Mode",
      body: "You make reels and somehow expect the internet to keep up with you 😂",
      photo: 1, tint: "lilac"
    },
    {
      icon: "🎵", title: "Music Person",
      body: "A playlist for every mood. Punjabi songs included, obviously.",
      photo: 5, tint: "mint"
    },
    {
      icon: "🧸", title: "Baby Magnet",
      body: "Apparently little humans just automatically choose you.",
      photo: 16, tint: "peach"
    },
    {
      icon: "🌶️", title: "Chatpati",
      body: "Self-certified chatpati. Evidence: still being collected.",
      photo: null, tint: "rose"
    },
    {
      icon: "😇", title: "Definitely Not Seedhi",
      body: "Seedhi? Yeah… we're not putting that claim on the website 😂",
      photo: null, tint: "gold"
    }
  ],


  /* ==========================================================================
     6. THE (highly unscientific) PERSONALITY REPORT
     Set `glitch: true` on any metric to make it render as ERROR 404.
     ========================================================================== */
  metrics: [
    { icon: "🌶️", label: "Chatpati",                 value: 98 },
    { icon: "🎬", label: "Reel Creator",             value: 94 },
    { icon: "🎵", label: "Punjabi Song Energy",      value: 89 },
    { icon: "🧸", label: "Baby Magnet",              value: 100 },
    { icon: "😂", label: "Professional Troublemaker", value: 87 },
    { icon: "😇", label: "Seedhi",                   value: 0, glitch: true }
  ],


  /* ==========================================================================
     7. THINGS I NOTICED
     ========================================================================== */
  noticed: [
    "You seem to care a lot about the people around you.",
    "You have a surprisingly soft corner for little things.",
    "You can turn a normal conversation into something much more entertaining.",
    "You somehow manage to be both sweet and slightly chaotic."
  ],


  /* ==========================================================================
     8. HER WORLD  —  each one opens a modal
     `photos` = how many pictures to show inside that modal
     ========================================================================== */
  world: [
    {
      icon: "🎬", key: "reels", title: "Reels / Content",
      body: "Creator mode: permanently ON.",
      extra: "Somewhere out there is a folder of drafts that will never see daylight, and honestly? Respect.",
      photos: 4
    },
    {
      icon: "🎵", key: "music", title: "Music",
      body: "Your playlist probably knows more about your moods than most people do 😂",
      extra: "There is a Punjabi song in there doing a lot of heavy lifting. We both know it.",
      photos: 3
    },
    {
      icon: "📱", key: "social", title: "Instagram / Snapchat",
      body: "The story updates are basically a live news channel at this point.",
      extra: "Posting rights: unlimited. Editing standards: extremely high.",
      photos: 4
    },
    {
      icon: "🧸", key: "kids", title: "Kids",
      body: "Little humans see you and immediately decide you're theirs.",
      extra: "Including one very persistent neighbourhood baby who clearly has excellent taste.",
      photos: 3
    },
    {
      icon: "✨", key: "surprises", title: "Cute Surprises",
      body: "Apparently you like cute surprises… so obviously I had to use that information.",
      extra: "You did say it out loud. That's basically consent for a whole website.",
      photos: 3
    }
  ],


  /* ==========================================================================
     9. THINGS I STILL DON'T KNOW
     ========================================================================== */
  mysteries: [
    { icon: "🎵", title: "The song you'll never get tired of", status: "Still investigating." },
    { icon: "🌍", title: "Your perfect place",                 status: "Classified information." },
    { icon: "☀️", title: "Your perfect day",                   status: "Need more data." },
    { icon: "😂", title: "What makes you laugh the hardest",   status: "Research ongoing." },
    { icon: "❤️", title: "What genuinely makes you happiest",  status: "Maybe I'll find out eventually." }
  ],


  /* ==========================================================================
     10. THE FINAL MESSAGE  —  revealed one line at a time
     ========================================================================== */
  letter: [
    "I know we haven't known each other for that long, so I won't pretend I've figured you out completely.",
    "But in the little time I've known you, I've learned that you're chatpati, slightly unpredictable, very fond of little humans, a music person, and definitely not as seedhi as you pretend to be 😂",
    "I hope this year gives you a lot of reasons to smile, a lot of good memories, and plenty of moments that make you genuinely happy.",
    "Keep making your reels, keep being your weird little self, and don't change the things that make you… you.",
    "Happy Birthday, September Girl. ✨"
  ],


  /* ==========================================================================
     11. NAVIGATION  —  which sections get a dot. Order matters.
     ========================================================================== */
  nav: [
    { id: "hello",      label: "Start" },
    { id: "figured",    label: "You" },
    { id: "report",     label: "Report" },
    { id: "noticed",    label: "Noticed" },
    { id: "evidence",   label: "Evidence" },
    { id: "world",      label: "Your world" },
    { id: "motion",     label: "Motion" },
    { id: "wall",       label: "The wall" },
    { id: "mystery",    label: "Mystery" },
    { id: "finale",     label: "🎁" }
  ]
};
