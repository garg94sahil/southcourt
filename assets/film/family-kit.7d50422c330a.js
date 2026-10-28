(function() {
  const W = 1920, H = 1080, M = 96;
  const COL = { w: 40, gap: 28, top: 340, bottom: 740 };
  const N = 4;
  const SPAN = N * COL.w + (N - 1) * COL.gap;
  const X0 = (W - SPAN) / 2;
  const LINTEL = { h: 6, over: 30, gap: 20 };
  const ROOM = { left: M, top: M, right: W - M, bottom: H - M };
  const FO = { W, H, M, COL, ROOM, LINTEL };
  FO.colX = (i) => X0 + i * (COL.w + COL.gap);
  FO.colCentre = (i) => FO.colX(i) + COL.w / 2;
  FO.lintelBox = (which) => ({
    left: X0 - LINTEL.over,
    width: SPAN + 2 * LINTEL.over,
    top: which === "top" ? COL.top - LINTEL.gap - LINTEL.h : COL.bottom + LINTEL.gap,
    height: LINTEL.h
  });
  const box = (cls, b, colour) => {
    const e = document.createElement("div");
    e.className = cls;
    e.style.cssText = "position:absolute;left:".concat(b.left, "px;top:").concat(b.top, "px;width:").concat(b.width, "px;height:").concat(b.height, "px;background:").concat(colour);
    return e;
  };
  FO.house = function(stage, colours) {
    const layer = document.createElement("div");
    layer.className = "house";
    layer.style.cssText = "position:absolute;top:0;right:0;bottom:0;left:0";
    const lintels = ["top", "bottom"].map((w) => box("lintel " + w, FO.lintelBox(w), "var(--ink)"));
    const cols = colours.map((c, i) => box("col", { left: FO.colX(i), top: COL.top, width: COL.w, height: COL.bottom - COL.top }, c));
    layer.append(...lintels, ...cols);
    stage.append(layer);
    return { layer, cols, lintels };
  };
  FO.closed = (stage, colours) => FO.house(stage, colours);
  FO.timing = (D) => ({
    hOpen: 400,
    hOpenDur: 1100,
    vOpen: 1100,
    vOpenDur: 1e3,
    vClose: D - 2300,
    vCloseDur: 900,
    hClose: D - 1700,
    hCloseDur: 1200,
    contentIn: 2100,
    contentOut: D - 2900
    // content has left (rise exit ~550 ms) before the room starts to close
  });
  FO.room = function(stage, i, colour, o = {}) {
    var _a, _b, _c;
    const t = FO.timing(HK.duration);
    const outer = document.createElement("div");
    const inner = document.createElement("div");
    outer.className = "room-outer";
    inner.className = "room";
    outer.style.cssText = "position:absolute;top:0;right:0;bottom:0;left:0;z-index:".concat((_a = o.z) != null ? _a : 2);
    inner.style.cssText = "position:absolute;top:0;right:0;bottom:0;left:0;overflow:hidden;background:".concat(colour);
    outer.append(inner);
    stage.append(outer);
    const x0 = (_b = o.x0) != null ? _b : FO.colX(i), x1 = (_c = o.x1) != null ? _c : x0 + COL.w;
    const hx = (l, r) => "inset(0px ".concat(W - r, "px 0px ").concat(l, "px)");
    HK.track(outer, [
      { t: 0, clipPath: hx(x0, x1) },
      { t: t.hOpen, clipPath: hx(x0, x1), ease: "inOut" },
      { t: t.hOpen + t.hOpenDur, clipPath: hx(ROOM.left, ROOM.right) },
      { t: t.hClose, clipPath: hx(ROOM.left, ROOM.right), ease: "inOut" },
      { t: t.hClose + t.hCloseDur, clipPath: hx(x0, x1) }
    ]);
    const vy = (top, bot) => "inset(".concat(top, "px 0px ").concat(H - bot, "px 0px)");
    HK.track(inner, [
      { t: 0, clipPath: vy(COL.top, COL.bottom) },
      { t: t.vOpen, clipPath: vy(COL.top, COL.bottom), ease: "out" },
      { t: t.vOpen + t.vOpenDur, clipPath: vy(ROOM.top, ROOM.bottom) },
      { t: t.vClose, clipPath: vy(ROOM.top, ROOM.bottom), ease: "inOut" },
      { t: t.vClose + t.vCloseDur, clipPath: vy(COL.top, COL.bottom) }
    ]);
    return { el: inner, timing: t };
  };
  FO.clock = function(stage, o = {}) {
    const tz = o.tz || "Asia/Kolkata";
    const e = document.createElement("div");
    e.className = "abs label clock";
    stage.append(e);
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true });
    const text = (d) => {
      const p = {};
      fmt.formatToParts(d).forEach((x) => {
        p[x.type] = x.value;
      });
      return "".concat(p.weekday, " ").concat(p.day, " ").concat(p.month, " \xB7 ").concat(p.hour, ":").concat(p.minute, " ").concat((p.dayPeriod || "").toUpperCase());
    };
    const tick = () => {
      const t = text(o.at || /* @__PURE__ */ new Date());
      if (e.textContent !== t) e.textContent = t;
    };
    tick();
    if (!o.at) setInterval(tick, 1e3);
    return e;
  };
  const NS = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs = {}) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };
  const rand = (seed) => {
    let s = seed * 9301 + 49297;
    return () => (s = (s * 9301 + 49297) % 233280) / 233280;
  };
  FO.diya = function(parent, x, y, seed = 1, o = {}) {
    const g = svgEl("g", { transform: "translate(".concat(x, " ").concat(y, ")") });
    const glow = svgEl("circle", { cx: 0, cy: -24, r: 22, fill: o.glow || "url(#diya-glow)" });
    const bowl = svgEl("path", { d: "M-23 -9 C-21 1 -11 4 0 4 C11 4 20 1 23 -9 L18 -9 C10 -6 -10 -6 -18 -9 Z", fill: o.clay || "#A8522D" });
    const rim = svgEl("path", { d: "M-23 -9 C-14 -12 14 -12 23 -9 C14 -6 -14 -6 -23 -9 Z", fill: o.rim || "#7C3A1E" });
    const flame = svgEl("path", { d: "M0 -40 C5 -32 7 -24 4 -17 C2.5 -13.5 -2.5 -13.5 -4 -17 C-7 -24 -5 -32 0 -40 Z", fill: o.flame || "#EE8A2A" });
    const core = svgEl("path", { d: "M0 -31 C2.6 -26 3.2 -21 1.7 -17.5 C0.8 -16 -0.8 -16 -1.7 -17.5 C-3.2 -21 -2.6 -26 0 -31 Z", fill: o.core || "#FFD36A" });
    const fl = svgEl("g");
    fl.append(flame, core);
    fl.style.cssText = "transform-box: fill-box; transform-origin: 50% 100%";
    g.append(glow, bowl, rim, fl);
    parent.append(g);
    const r = rand(seed), kf = [];
    for (let k = 0; k <= 8; k++) {
      const a = k === 8 ? kf[0] : { transform: "scale(".concat((0.94 + r() * 0.1).toFixed(3), ", ").concat((0.9 + r() * 0.16).toFixed(3), ") rotate(").concat((r() * 6 - 3).toFixed(2), "deg)") };
      kf.push(a);
    }
    fl.animate(kf, { duration: 1800 + r() * 900, iterations: Infinity, easing: "ease-in-out", delay: -r() * 2e3 });
    return g;
  };
  const live = (e, seed, frames, origin = "50% 100%", base = 2400) => {
    e.style.cssText = "transform-box: fill-box; transform-origin: ".concat(origin);
    const r = rand(seed);
    e.animate(frames, { duration: base + r() * 1200, iterations: Infinity, easing: "ease-in-out", delay: -r() * 3e3, direction: "alternate" });
  };
  const sway = (deg) => [{ transform: "rotate(".concat(-deg, "deg)") }, { transform: "rotate(".concat(deg, "deg)") }];
  const breathe = (a, b) => [{ transform: "scale(".concat(a, ")") }, { transform: "scale(".concat(b, ")") }];
  const OUTLINE = "#BDB5A6";
  const MOTIF = {
    star(svg, x, y, i) {
      const g = svgEl("g", { transform: "translate(".concat(x, " ").concat(y - 22, ")") });
      const pts = [...Array(10)].map((_, k) => {
        const a = Math.PI / 5 * k - Math.PI / 2, rr = k % 2 ? 7 : 17;
        return "".concat((rr * Math.cos(a)).toFixed(1), ",").concat((rr * Math.sin(a)).toFixed(1));
      });
      const s = svgEl("polygon", { points: pts.join(" "), fill: i % 3 === 1 ? "#C9A227" : "#E2B04A" });
      g.append(s);
      svg.append(g);
      live(s, i + 7, breathe(0.86, 1.06), "50% 50%");
    },
    kite(svg, x, y, i, palette) {
      const c = palette[i % palette.length];
      const g = svgEl("g", { transform: "translate(".concat(x, " ").concat(y, ")") });
      const k = svgEl("g");
      k.append(
        svgEl("path", { d: "M0 -2 C5 4 -5 8 2 14", fill: "none", stroke: OUTLINE, "stroke-width": 1.5 }),
        svgEl("polygon", { points: "0,-50 15,-30 0,-6 -15,-30", fill: c, stroke: OUTLINE, "stroke-width": 1.2 }),
        svgEl("line", { x1: -15, y1: -30, x2: 15, y2: -30, stroke: "rgba(26,23,20,0.25)", "stroke-width": 1.2 }),
        svgEl("line", { x1: 0, y1: -50, x2: 0, y2: -6, stroke: "rgba(26,23,20,0.25)", "stroke-width": 1.2 })
      );
      g.append(k);
      svg.append(g);
      live(k, i + 11, sway(5), "50% 100%", 2800);
    },
    flower(svg, x, y, i, colours, centre = "#B5521E") {
      const c = colours[i % colours.length];
      const g = svgEl("g", { transform: "translate(".concat(x, " ").concat(y - 22, ")") });
      const f = svgEl("g");
      for (let k = 0; k < 10; k++) {
        const a = Math.PI / 5 * k;
        f.append(svgEl("circle", { cx: (10 * Math.cos(a)).toFixed(1), cy: (10 * Math.sin(a)).toFixed(1), r: 6.5, fill: c, stroke: c === "#FFFFFF" ? OUTLINE : "none", "stroke-width": 1 }));
      }
      f.append(svgEl("circle", { r: 6, fill: centre }));
      g.append(f);
      svg.append(g);
      live(f, i + 3, breathe(0.95, 1.04), "50% 50%", 3e3);
    },
    pookalam(svg, x, y, i) {
      const g = svgEl("g", { transform: "translate(".concat(x, " ").concat(y - 22, ")") });
      const f = svgEl("g");
      [[20, "#EE8A2A"], [15, "#F4C430"], [10, "#FFFFFF"], [5.5, "#B8322A"]].forEach(([r, c]) => f.append(svgEl("circle", { r, fill: c, stroke: c === "#FFFFFF" ? OUTLINE : "none", "stroke-width": 1 })));
      g.append(f);
      svg.append(g);
      live(f, i + 5, breathe(0.96, 1.03), "50% 50%", 3200);
    },
    gulal(svg, x, y, i) {
      const cs = ["#E8559A", "#F5C518", "#3DBE6C", "#3D7FE0", "#F28C28"];
      const g = svgEl("g", { transform: "translate(".concat(x, " ").concat(y - 22, ")") });
      [[-9, 4, 13, cs[i % 5]], [8, 2, 12, cs[(i + 2) % 5]], [0, -8, 11, cs[(i + 4) % 5]]].forEach(([cx, cy, r, c], k) => {
        const p = svgEl("circle", { cx, cy, r, fill: c, opacity: 0.78 });
        g.append(p);
        live(p, i * 3 + k, breathe(0.88, 1.08), "50% 50%", 2600);
      });
      svg.append(g);
    },
    wheat(svg, x, y, i) {
      const g = svgEl("g", { transform: "translate(".concat(x, " ").concat(y, ")") });
      const w = svgEl("g");
      w.append(svgEl("path", { d: "M0 4 C1 -14 -1 -30 1 -52", fill: "none", stroke: "#B8862E", "stroke-width": 2 }));
      for (let k = 0; k < 5; k++) {
        const yy = -24 - k * 6.2;
        w.append(
          svgEl("ellipse", { cx: -4.2, cy: yy, rx: 3, ry: 5.5, fill: "#D9A441", transform: "rotate(-28 -4.2 ".concat(yy, ")") }),
          svgEl("ellipse", { cx: 4.6, cy: yy - 2, rx: 3, ry: 5.5, fill: "#C8922F", transform: "rotate(28 4.6 ".concat(yy - 2, ")") })
        );
      }
      w.append(svgEl("ellipse", { cx: 1, cy: -55, rx: 2.6, ry: 5, fill: "#D9A441" }));
      g.append(w);
      svg.append(g);
      live(w, i + 13, sway(3), "50% 100%", 3e3);
    },
    feather(svg, x, y, i) {
      const g = svgEl("g", { transform: "translate(".concat(x, " ").concat(y, ") rotate(").concat(i % 2 ? 10 : -10, ")") });
      const f = svgEl("g");
      f.append(
        svgEl("path", { d: "M0 6 C1 -10 0 -30 0 -50", fill: "none", stroke: "#6B7F3A", "stroke-width": 1.8 }),
        svgEl("ellipse", { cx: 0, cy: -34, rx: 10, ry: 19, fill: "#3E8E5A" }),
        svgEl("ellipse", { cx: 0, cy: -38, rx: 6.5, ry: 8.5, fill: "#D9A93A" }),
        svgEl("ellipse", { cx: 0, cy: -38, rx: 4.6, ry: 6.2, fill: "#1F6FB2" }),
        svgEl("ellipse", { cx: 0, cy: -37, rx: 2.4, ry: 3.2, fill: "#132B4F" })
      );
      g.append(f);
      svg.append(g);
      live(f, i + 17, sway(4), "50% 100%", 3200);
    }
  };
  const row = (svg, n, draw) => {
    const pitch = (ROOM.right - ROOM.left) / n;
    for (let k = 0; k < n; k++) draw(ROOM.left + pitch * (k + 0.5), H - 30, k);
  };
  const glowDefs = (svg) => {
    const defs = svgEl("defs");
    const grad = svgEl("radialGradient", { id: "diya-glow" });
    grad.append(
      svgEl("stop", { offset: "0", "stop-color": "#F7B548", "stop-opacity": "0.32" }),
      svgEl("stop", { offset: "1", "stop-color": "#F7B548", "stop-opacity": "0" })
    );
    defs.append(grad);
    svg.append(defs);
  };
  const TRICOLOUR = ["#FF9933", "#FFFFFF", "#138808"];
  const DRESS = {
    // Diwali, Gurpurab: a row of lit diyas along the bottom margin, like lamps on a threshold
    diyas(svg) {
      glowDefs(svg);
      row(svg, 12, (x, y, k) => FO.diya(svg, x, y, k + 1));
    },
    // Navratri: nine diyas, one more lit each night (o.lit, 1-9); on Dussehra all nine glow
    navratri(svg, o) {
      var _a;
      glowDefs(svg);
      const lit = Math.max(0, Math.min(9, (_a = o.lit) != null ? _a : 9));
      row(svg, 9, (x, y, k) => {
        const d = FO.diya(svg, x, y, k + 1);
        if (k >= lit) d.querySelectorAll("circle, g").forEach((e) => e.remove());
      });
    },
    stars: (svg) => row(svg, 12, (x, y, k) => MOTIF.star(svg, x, y, k)),
    kites: (svg) => row(svg, 12, (x, y, k) => MOTIF.kite(svg, x, y, k, ["#E4572E", "#F2B134", "#2A9D8F", "#3B6FB6", "#C2185B"])),
    "kites-tricolour": (svg) => row(svg, 12, (x, y, k) => MOTIF.kite(svg, x, y, k, TRICOLOUR)),
    tricolour: (svg) => row(svg, 12, (x, y, k) => MOTIF.flower(svg, x, y, k, TRICOLOUR, "#000080")),
    marigolds: (svg) => row(svg, 12, (x, y, k) => MOTIF.flower(svg, x, y, k, ["#F08A24", "#F6C22B"])),
    pookalam: (svg) => row(svg, 12, (x, y, k) => MOTIF.pookalam(svg, x, y, k)),
    gulal: (svg) => row(svg, 12, (x, y, k) => MOTIF.gulal(svg, x, y, k)),
    wheat: (svg) => row(svg, 12, (x, y, k) => MOTIF.wheat(svg, x, y, k)),
    peacock: (svg) => row(svg, 12, (x, y, k) => MOTIF.feather(svg, x, y, k)),
    // Raksha Bandhan: one thread along the bottom margin, with a rakhi rosette in each slot
    rakhi(svg) {
      svg.append(svgEl("path", { d: "M".concat(ROOM.left, " ").concat(H - 52, " L").concat(ROOM.right, " ").concat(H - 52), stroke: "#C9A227", "stroke-width": 2.5, fill: "none" }));
      row(svg, 12, (x, y, k) => MOTIF.flower(svg, x, y, k, ["#E4572E", "#F08A24"], "#E2B04A"));
    },
    // Gudi Padwa and Ugadi: a toran of mango leaves and marigolds across the TOP margin, as over a door
    toran(svg) {
      const y0 = 14, n = 24, pitch = (ROOM.right - ROOM.left) / n;
      svg.append(svgEl("path", { d: "M".concat(ROOM.left, " ").concat(y0, " L").concat(ROOM.right, " ").concat(y0), stroke: "#6B8E23", "stroke-width": 2.5, fill: "none" }));
      for (let k = 0; k < n; k++) {
        const x = ROOM.left + pitch * (k + 0.5);
        if (k % 2) {
          MOTIF.flower(svg, x, y0 + 40, k, ["#F08A24", "#F6C22B"]);
          continue;
        }
        const g = svgEl("g", { transform: "translate(".concat(x, " ").concat(y0, ")") });
        const leaf = svgEl("path", { d: "M0 0 C9 12 9 34 0 52 C-9 34 -9 12 0 0 Z", fill: k % 4 ? "#5C8A2E" : "#79A33A" });
        g.append(leaf);
        svg.append(g);
        live(leaf, k + 19, sway(3), "50% 0%", 3200);
      }
    }
  };
  FO.dress = function(stage, kind, o = {}) {
    if (!DRESS[kind]) return null;
    const svg = svgEl("svg", { width: W, height: H, viewBox: "0 0 ".concat(W, " ").concat(H) });
    svg.classList.add("dress", kind);
    svg.style.cssText = "position:absolute;top:0;right:0;bottom:0;left:0;overflow:hidden;pointer-events:none";
    DRESS[kind](svg, o);
    stage.append(svg);
    return svg;
  };
  FO.current = function(node, today) {
    if (Array.isArray(node)) return node.map((x) => FO.current(x, today)).filter((x) => x != null);
    if (node && typeof node === "object") {
      if ("until" in node && "text" in node && Object.keys(node).length === 2) return !today || today <= node.until ? node.text : null;
      const out = {};
      for (const [key, val] of Object.entries(node)) {
        const r = FO.current(val, today);
        if (r != null) out[key] = r;
      }
      return out;
    }
    return node;
  };
  window.FO = FO;
})();
