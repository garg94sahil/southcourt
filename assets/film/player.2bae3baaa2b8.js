/* South Court reception film: the player (the loop, festivals, updates).
 * Inlined into the self-contained page (apps/dist/group-profile.html) and published as its own
 * file for the fast-loading page on GitHub Pages (see apps/build_player.py, cdn variant). */
(function () {
  const M = window.FILM;
  const BUILD = document.querySelector('meta[name="build"]').content;
  const LOADED = Date.now();
  const frame = document.getElementById('frame');
  const log = (window.FILM_LOG = []); // scene timings, read by tools/test_player.py
  const mark = (what, id) => log.push({ t: Math.round(performance.now()), what, id });

  const frames = (n) => new Promise((r) => { const step = () => (n-- <= 0 ? r() : requestAnimationFrame(step)); requestAnimationFrame(step); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Updates: the TV never reloads by itself, so ask for version.txt every 30 min
  // and reload at the end of a loop when a new build has been published.
  // The same request also reads GitHub's clock (the Date header): if the TV's own clock is more
  // than 5 minutes off, festival windows follow the server's date instead.
  let updateWaiting = false, skew = 0;
  const checkVersion = async () => {
    try {
      const r = await fetch('version.txt?ts=' + Date.now(), { cache: 'no-store' });
      const server = Date.parse(r.headers.get('Date') || '');
      if (server) skew = Math.abs(server - Date.now()) > 5 * 60e3 ? server - Date.now() : 0;
      if (!r.ok) return;
      const v = (await r.text()).trim();
      if (v && v !== BUILD) updateWaiting = true;
    } catch (e) { /* offline or opened from disk: keep playing */ }
  };
  if (location.protocol.startsWith('http')) { checkVersion(); setInterval(checkVersion, 30 * 60e3); }

  // Festival wishes (content/festivals.yaml): the page carries each approved festival's window for
  // every year in the dates table. At the start of every loop it checks today's date in IST; inside
  // a window the wish opens the loop and the margins are dressed. Overlaps: the nearer main day wins.
  // ?date=YYYY-MM-DD (or #date-YYYY-MM-DD, for hosts that drop the query) plays the page as if it
  // were that day: tools/test_player.py --date, and the review page's festival preview.
  const TEST_DATE = new URLSearchParams(location.search).get('date') || (location.hash.match(/date-(\d{4}-\d{2}-\d{2})/) || [])[1] || null;
  // India has one fixed offset (UTC+5:30, no daylight saving), so plain arithmetic gives the IST date
  // on any browser, with no dependence on its time-zone data.
  const today = () => TEST_DATE || new Date(Date.now() + skew + 330 * 60e3).toISOString().slice(0, 10);
  const dayNo = (iso) => Date.parse(iso + 'T00:00:00Z') / 864e5;
  // Returns { scene, dress, opts } for today, or null. On the main day itself a festival's `on_day`
  // fields replace the usual ones (Navratri -> Dussehra); Navratri's lamps count the nights.
  function wishToday() {
    const d = today();
    let best = null;
    for (const w of M.wishes || []) for (const x of w.windows) {
      const dist = Math.abs(dayNo(x.day) - dayNo(d));
      if (x.from <= d && d <= x.to && (!best || dist < best.dist)) best = { w, x, dist };
    }
    if (!best) return null;
    const { w, x } = best;
    const scene = d === x.day && w.scene.on_day ? { ...w.scene, ...w.scene.on_day } : w.scene;
    const lit = d >= x.day ? 9 : Math.max(1, Math.min(9, dayNo(d) - dayNo(x.first || x.from) + 1));
    return { scene, dress: w.dress, opts: { lit } };
  }
  let dressEl = null, dressKey = null;
  function dress(kind, opts = {}) {
    const key = kind ? kind + ':' + (kind === 'navratri' ? opts.lit : '') : null;
    if (key === dressKey) return;
    if (dressEl) { const old = dressEl; old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1000, fill: 'forwards' }).finished.then(() => old.remove()); }
    dressEl = kind ? FO.dress(frame, kind, opts) : null;
    if (dressEl) dressEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1200, easing: 'ease-out' });
    dressKey = key;
  }

  let live = null; // the scene on screen
  async function playScene(s) {
    const root = document.createElement('div');
    root.className = 'stage';
    frame.append(root);
    const scene = window.buildScene(root, s, M);
    await frames(2);                 // its first frame (the closed house) is on screen...
    if (live) live.dispose();        // ...before the previous scene is taken down
    live = scene;
    mark('start', s.id);
    await sleep(s.ms);
    mark('end', s.id);
  }

  // Reload only when the site answers: reloading while the Wi-Fi is down would leave the TV on the
  // browser's "no internet" page until someone notices. Offline, keep playing and try next loop.
  const online = async () => {
    if (!location.protocol.startsWith('http')) return true;
    try { return (await fetch('version.txt?ts=' + Date.now(), { cache: 'no-store' })).ok; } catch (e) { return false; }
  };

  async function loop() {
    // Festivals and dated lines: any failure here falls back to the plain film, never a frozen screen
    let plan = M.scenes;
    try {
      if (!M.wishes && window.FILM_WISHES) Object.assign(M, window.FILM_WISHES); // the festival data arrives last
      const w = wishToday();
      if (w) await Promise.race([decodeAll(w.scene), sleep(4000)]); // its art and logos, decoded before it plays
      dress(w ? w.dress : null, w ? w.opts : {});
      plan = (w ? [w.scene, ...M.scenes] : M.scenes).map((s) => FO.current(s, today())); // expired lines drop out
    } catch (e) {
      mark('error', `festival: ${e}`);
      try { dress(null); } catch (e2) { /* keep going */ }
      plan = M.scenes.map((s) => { try { return FO.current(s, today()); } catch (e3) { return s; } });
    }
    window.FILM_PLAN = plan.map((s) => s.id);
    for (const s of plan) {
      try { await playScene(s); } catch (e) { mark('error', `${s.id}: ${e}`); }
    }
    mark('loop', BUILD);
    // A new build, or once a day after ~20 h (memory): start fresh, but only if the site answers
    if ((updateWaiting || Date.now() - LOADED > 20 * 3600e3) && (await online())) return location.reload();
    setTimeout(loop, 0);
  }
  // Decode every logo and photo of the film before the first scene, so nothing pops in late.
  // A festival's art is decoded at the start of the loop that first plays it (memory stays low
  // however many festivals the page carries).
  const decode = (src) => { const i = new Image(); i.src = src; return i.decode().catch(() => {}); };
  const decodeAll = (node) => {
    const sources = [];
    JSON.stringify(node, (k, v) => { if (k === 'src' && typeof v === 'string') sources.push(v); return v; });
    return Promise.all(sources.map(decode));
  };
  // Load the declared fonts directly: document.fonts.ready would wait for the whole document,
  // festival data included, before the film could start.
  const fontsLoaded = Promise.all([...document.fonts].map((f) => f.load().catch(() => {})));
  Promise.all([fontsLoaded, decodeAll(M.scenes)]).then(() => {
    window.COMP_READY = true;
    loop();
  });
})();
