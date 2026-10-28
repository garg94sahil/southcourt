var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
(function() {
  const M = window.FILM;
  const BUILD = document.querySelector('meta[name="build"]').content;
  const LOADED = Date.now();
  const frame = document.getElementById("frame");
  const log = window.FILM_LOG = [];
  const mark = (what, id) => log.push({ t: Math.round(performance.now()), what, id });
  const frames = (n) => new Promise((r) => {
    const step = () => n-- <= 0 ? r() : requestAnimationFrame(step);
    requestAnimationFrame(step);
  });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let updateWaiting = false, skew = 0;
  const checkVersion = async () => {
    try {
      const r = await fetch("version.txt?ts=" + Date.now(), { cache: "no-store" });
      const server = Date.parse(r.headers.get("Date") || "");
      if (server) skew = Math.abs(server - Date.now()) > 5 * 6e4 ? server - Date.now() : 0;
      if (!r.ok) return;
      const v = (await r.text()).trim();
      if (v && v !== BUILD) updateWaiting = true;
    } catch (e) {
    }
  };
  if (location.protocol.startsWith("http")) {
    checkVersion();
    setInterval(checkVersion, 30 * 6e4);
  }
  const TEST_DATE = new URLSearchParams(location.search).get("date") || (location.hash.match(/date-(\d{4}-\d{2}-\d{2})/) || [])[1] || null;
  const today = () => TEST_DATE || new Date(Date.now() + skew + 330 * 6e4).toISOString().slice(0, 10);
  const dayNo = (iso) => Date.parse(iso + "T00:00:00Z") / 864e5;
  function wishToday() {
    const d = today();
    let best = null;
    for (const w2 of M.wishes || []) for (const x2 of w2.windows) {
      const dist = Math.abs(dayNo(x2.day) - dayNo(d));
      if (x2.from <= d && d <= x2.to && (!best || dist < best.dist)) best = { w: w2, x: x2, dist };
    }
    if (!best) return null;
    const { w, x } = best;
    const scene = d === x.day && w.scene.on_day ? __spreadValues(__spreadValues({}, w.scene), w.scene.on_day) : w.scene;
    const lit = d >= x.day ? 9 : Math.max(1, Math.min(9, dayNo(d) - dayNo(x.first || x.from) + 1));
    return { scene, dress: w.dress, opts: { lit } };
  }
  let dressEl = null, dressKey = null;
  function dress(kind, opts = {}) {
    const key = kind ? kind + ":" + (kind === "navratri" ? opts.lit : "") : null;
    if (key === dressKey) return;
    if (dressEl) {
      const old = dressEl;
      old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1e3, fill: "forwards" });
      setTimeout(() => old.remove(), 1100);
    }
    dressEl = kind ? FO.dress(frame, kind, opts) : null;
    if (dressEl) dressEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1200, easing: "ease-out" });
    dressKey = key;
  }
  let live = null;
  async function playScene(s) {
    const root = document.createElement("div");
    root.className = "stage";
    frame.append(root);
    const scene = window.buildScene(root, s, M);
    await frames(2);
    if (live) live.dispose();
    live = scene;
    mark("start", s.id);
    await sleep(s.ms);
    mark("end", s.id);
  }
  const online = async () => {
    if (!location.protocol.startsWith("http")) return true;
    try {
      return (await fetch("version.txt?ts=" + Date.now(), { cache: "no-store" })).ok;
    } catch (e) {
      return false;
    }
  };
  async function loop() {
    let plan = M.scenes;
    try {
      if (!M.wishes && window.FILM_WISHES) Object.assign(M, window.FILM_WISHES);
      const w = wishToday();
      if (w) await Promise.race([decodeAll(w.scene), sleep(4e3)]);
      dress(w ? w.dress : null, w ? w.opts : {});
      plan = (w ? [w.scene, ...M.scenes] : M.scenes).map((s) => FO.current(s, today()));
    } catch (e) {
      mark("error", "festival: ".concat(e));
      try {
        dress(null);
      } catch (e2) {
      }
      plan = M.scenes.map((s) => {
        try {
          return FO.current(s, today());
        } catch (e3) {
          return s;
        }
      });
    }
    window.FILM_PLAN = plan.map((s) => s.id);
    for (const s of plan) {
      try {
        await playScene(s);
      } catch (e) {
        mark("error", "".concat(s.id, ": ").concat(e));
      }
    }
    mark("loop", BUILD);
    if ((updateWaiting || Date.now() - LOADED > 20 * 36e5) && await online()) return location.reload();
    setTimeout(loop, 0);
  }
  const decode = (src) => {
    const i = new Image();
    const loaded = new Promise((r) => {
      i.onload = i.onerror = r;
    });
    i.src = src;
    return i.decode ? i.decode().catch(() => {
    }) : loaded;
  };
  const decodeAll = (node) => {
    const sources = [];
    JSON.stringify(node, (k, v) => {
      if (k === "src" && typeof v === "string") sources.push(v);
      return v;
    });
    return Promise.all(sources.map(decode));
  };
  const faces = [];
  if (document.fonts && document.fonts.forEach) document.fonts.forEach((f) => faces.push(f.load().catch(() => {
  })));
  const fontsLoaded = Promise.all(faces);
  Promise.all([fontsLoaded, decodeAll(M.scenes)]).then(() => {
    window.COMP_READY = true;
    loop();
  });
})();
