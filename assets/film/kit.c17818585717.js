var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
(function() {
  const W = 1920, H = 1080, M = 96;
  const NS = "http://www.w3.org/2000/svg";
  const EASE = {
    out: "cubic-bezier(0.22, 1, 0.36, 1)",
    in: "cubic-bezier(0.55, 0, 0.85, 0.36)",
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    linear: "linear"
  };
  const BAR = { outer: -62.1, inner: -26.38, top: -125.03, bottom: 125.72, wedgeTop: -29.48, wedgeBot: 30.22 };
  const HK = { W, H, M, EASE, BAR, params: new URLSearchParams(location.search) };
  HK.init = function({ duration, fps = 25, poster }) {
    HK.duration = duration;
    window.COMP = { duration, fps, poster: poster != null ? poster : Math.round(duration / 2) };
  };
  HK.ready = async function() {
    await document.fonts.ready;
    window.COMP_READY = true;
  };
  window.__seek = function(t) {
    for (const a of document.getAnimations ? document.getAnimations() : []) {
      a.pause();
      a.currentTime = t;
    }
  };
  HK.track = function(el, frames, duration = HK.duration) {
    const f = frames.slice().sort((a, b) => a.t - b.t);
    if (f[0].t > 0) f.unshift(__spreadProps(__spreadValues({}, f[0]), { t: 0, ease: "linear" }));
    if (f[f.length - 1].t < duration) f.push(__spreadProps(__spreadValues({}, f[f.length - 1]), { t: duration }));
    const kf = f.map((_a) => {
      var _b = _a, { t, ease } = _b, props = __objRest(_b, ["t", "ease"]);
      return __spreadProps(__spreadValues({}, props), {
        offset: Math.min(1, Math.max(0, t / duration)),
        easing: EASE[ease] || ease || "linear"
      });
    });
    return el.animate(kf, { duration, fill: "both" });
  };
  const svgEl = (tag, attrs = {}) => {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  };
  HK.doors = function(stage, o) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const s = (_a = o.scale) != null ? _a : 1.3;
    const cx = W / 2, cy = H / 2;
    const railTop = (_b = o.railTop) != null ? _b : M, railBot = (_c = o.railBottom) != null ? _c : H - M;
    const openX = (_d = o.openX) != null ? _d : M;
    const dx = openX - (cx + BAR.outer * s);
    const openTop = (railTop - cy) / s, openBot = (railBot - cy) / s;
    const barPath = (top, bot) => {
      const f = (v) => +v.toFixed(3);
      return 'path("M'.concat(f(BAR.outer), " ").concat(f(top), "L").concat(f(BAR.inner), " ").concat(f(top), "L").concat(f(BAR.inner), " ").concat(BAR.wedgeTop, "L0 0L").concat(f(BAR.inner), " ").concat(BAR.wedgeBot, "L").concat(f(BAR.inner), " ").concat(f(bot), "L").concat(f(BAR.outer), " ").concat(f(bot), 'Z")');
    };
    const t = {
      open: o.open,
      openDur: (_e = o.openDur) != null ? _e : 1300,
      extend: (_f = o.extend) != null ? _f : o.open + 650,
      extendDur: (_g = o.extendDur) != null ? _g : 1100,
      retract: o.retract,
      retractDur: (_h = o.retractDur) != null ? _h : 900,
      close: (_i = o.close) != null ? _i : o.retract + 500,
      closeDur: (_j = o.closeDur) != null ? _j : 1300
    };
    const doors = ["left", "right"].map((side) => {
      var _a2;
      const sign = side === "left" ? 1 : -1;
      const svg = svgEl("svg", { width: W, height: H, viewBox: "0 0 ".concat(W, " ").concat(H) });
      svg.style.cssText = "position:absolute;top:0;right:0;bottom:0;left:0;overflow:visible;fill:".concat(o.color || "var(--white)", ";z-index:").concat((_a2 = o.z) != null ? _a2 : 5);
      const move = svgEl("g");
      const place = svgEl("g", { transform: "translate(".concat(cx, " ").concat(cy, ") scale(").concat(sign * s, " ").concat(s, ")") });
      const bar = svgEl("path");
      bar.style.d = barPath(BAR.top, BAR.bottom);
      place.append(bar);
      move.append(place);
      svg.append(move);
      stage.append(svg);
      const shut = "translateX(0px)", open = "translateX(".concat(sign * dx, "px)");
      HK.track(move, [
        { t: 0, transform: shut },
        { t: t.open, transform: shut, ease: "inOut" },
        { t: t.open + t.openDur, transform: open },
        { t: t.close, transform: open, ease: "inOut" },
        { t: t.close + t.closeDur, transform: shut }
      ]);
      const closedD = barPath(BAR.top, BAR.bottom), railD = barPath(openTop, openBot);
      HK.track(bar, [
        { t: 0, d: closedD },
        { t: t.extend, d: closedD, ease: "out" },
        { t: t.extend + t.extendDur, d: railD },
        { t: t.retract, d: railD, ease: "inOut" },
        { t: t.retract + t.retractDur, d: closedD }
      ]);
      return svg;
    });
    return {
      scale: s,
      timing: t,
      dx,
      doors,
      railInner: openX + (BAR.inner - BAR.outer) * s,
      // x of the left rail's inner edge
      tipX: openX - BAR.outer * s,
      // x of the left wedge tip when open
      railTop,
      railBot,
      closedTop: cy + BAR.top * s,
      closedBot: cy + BAR.bottom * s
    };
  };
  HK.closedH = function(stage, o = {}) {
    var _a;
    const s = (_a = o.scale) != null ? _a : 1.3, cx = W / 2, cy = H / 2;
    const d = "M".concat(BAR.outer, " ").concat(BAR.top, "L").concat(BAR.inner, " ").concat(BAR.top, "L").concat(BAR.inner, " ").concat(BAR.wedgeTop, "L0 0L").concat(BAR.inner, " ").concat(BAR.wedgeBot, "L").concat(BAR.inner, " ").concat(BAR.bottom, "L").concat(BAR.outer, " ").concat(BAR.bottom, "Z");
    for (const sign of [1, -1]) {
      const svg = svgEl("svg", { width: W, height: H, viewBox: "0 0 ".concat(W, " ").concat(H) });
      svg.style.cssText = "position:absolute;top:0;right:0;bottom:0;left:0;overflow:visible;fill:".concat(o.color || "var(--indigo)");
      const g = svgEl("g", { transform: "translate(".concat(cx, " ").concat(cy, ") scale(").concat(sign * s, " ").concat(s, ")") });
      g.append(svgEl("path", { d }));
      svg.append(g);
      stage.append(svg);
    }
  };
  HK.room = function(stage, d, o = {}) {
    var _a, _b;
    const gap = (_a = o.gap) != null ? _a : 40;
    const cx = W / 2;
    const t = d.timing;
    const outer = document.createElement("div");
    const inner = document.createElement("div");
    outer.style.cssText = "position:absolute;top:0;right:0;bottom:0;left:0;z-index:".concat((_b = o.z) != null ? _b : 1);
    inner.style.cssText = "position:absolute;top:0;right:0;bottom:0;left:0;background:".concat(o.color || "var(--concrete)");
    outer.append(inner);
    stage.append(outer);
    const xShut = cx;
    const xOpen = d.tipX + gap;
    const hx = (x) => "inset(0px ".concat(x, "px 0px ").concat(x, "px)");
    HK.track(outer, [
      { t: 0, clipPath: hx(xShut) },
      { t: t.open, clipPath: hx(xShut), ease: "inOut" },
      { t: t.open + t.openDur, clipPath: hx(xOpen) },
      { t: t.close, clipPath: hx(xOpen), ease: "inOut" },
      { t: t.close + t.closeDur, clipPath: hx(xShut) }
    ]);
    const vy = (top, bot) => "inset(".concat(top, "px 0px ").concat(H - bot, "px 0px)");
    const shut = vy(d.closedTop, d.closedBot), open = vy(d.railTop, d.railBot);
    HK.track(inner, [
      { t: 0, clipPath: shut },
      { t: t.extend, clipPath: shut, ease: "out" },
      { t: t.extend + t.extendDur, clipPath: open },
      { t: t.retract, clipPath: open, ease: "inOut" },
      { t: t.retract + t.retractDur, clipPath: shut }
    ]);
    return { el: inner, left: xOpen, right: W - xOpen, top: d.railTop, bottom: d.railBot };
  };
  HK.rise = function(el, tIn, tOut, o = {}) {
    var _a, _b, _c;
    const dist = (_a = o.dist) != null ? _a : 30, din = (_b = o.din) != null ? _b : 900, dout = (_c = o.dout) != null ? _c : 550;
    return HK.track(el, [
      { t: 0, opacity: 0, transform: "translateY(".concat(dist, "px)") },
      { t: tIn, opacity: 0, transform: "translateY(".concat(dist, "px)"), ease: "out" },
      { t: tIn + din, opacity: 1, transform: "translateY(0px)" },
      { t: tOut, opacity: 1, transform: "translateY(0px)", ease: "in" },
      { t: tOut + dout, opacity: 0, transform: "translateY(".concat(-dist * 0.6, "px)") }
    ]);
  };
  HK.maskUp = function(el, tIn, tOut, o = {}) {
    var _a, _b;
    const din = (_a = o.din) != null ? _a : 900, dout = (_b = o.dout) != null ? _b : 700;
    return HK.track(el, [
      { t: 0, transform: "translateY(110%)" },
      { t: tIn, transform: "translateY(110%)", ease: "out" },
      { t: tIn + din, transform: "translateY(0%)" },
      { t: tOut, transform: "translateY(0%)", ease: "inOut" },
      { t: tOut + dout, transform: "translateY(110%)" }
    ]);
  };
  HK.draw = function(paths, tStart, dur, stagger, tOut, dout = 600) {
    paths.forEach((p, i) => {
      p.setAttribute("pathLength", "1");
      p.style.strokeDasharray = "1 1";
      const t0 = tStart + i * stagger;
      HK.track(p, [
        { t: 0, strokeDashoffset: 1, opacity: 0 },
        { t: t0, strokeDashoffset: 1, opacity: 1, ease: "inOut" },
        { t: t0 + dur, strokeDashoffset: 0, opacity: 1 },
        { t: tOut, strokeDashoffset: 0, opacity: 1, ease: "out" },
        { t: tOut + dout, strokeDashoffset: 0, opacity: 0 }
      ]);
    });
  };
  HK.flag = function(parent, o) {
    var _a, _b, _c, _d;
    const W2 = o.w, FH = W2 * 2 / 3, band = FH / 3, D = HK.duration;
    const COLOURS = { saffron: "#FF9933", white: "#FFFFFF", green: "#138808", navy: "#000080" };
    const root = svgEl("g", { transform: "translate(".concat(o.x, " ").concat(o.y, ")") });
    const hoist = svgEl("g");
    const bands = [COLOURS.saffron, COLOURS.white, COLOURS.green].map((fill) => svgEl("path", { fill, stroke: "none" }));
    const outline = svgEl("path", { fill: "none", stroke: o.outline || "currentColor", "stroke-width": o.outlineWidth || 2, "stroke-linejoin": "round" });
    const chakra = svgEl("g");
    const k = band * 0.4 / 20;
    const wheel = svgEl("g", { transform: "scale(".concat(k, ")"), fill: COLOURS.navy, stroke: "none" });
    wheel.append(svgEl("circle", { r: 20 }), svgEl("circle", { r: 17.5, fill: COLOURS.white }), svgEl("circle", { r: 3.5 }));
    for (let i = 0; i < 24; i++) {
      wheel.append(svgEl("path", { d: "M0 17.5L0.6 7L0 2L-0.6 7Z", transform: "rotate(".concat(i * 15, ")") }));
      wheel.append(svgEl("circle", { r: 0.875, transform: "rotate(".concat(i * 15 + 7.5, ") translate(0 17.5)") }));
    }
    chakra.append(wheel);
    hoist.append(...bands, chakra, outline);
    root.append(hoist);
    parent.append(root);
    const hoistAt = (_a = o.hoistAt) != null ? _a : 2600, hoistDur = (_b = o.hoistDur) != null ? _b : 1800;
    const ramp = (t) => {
      const x = Math.min(1, Math.max(0, (t - hoistAt) / hoistDur));
      return x * x * (3 - 2 * x);
    };
    const period = (_c = o.period) != null ? _c : 2600, lambda = W2 * 0.95, A = FH * 0.05;
    const off = (u, t) => A * ramp(t) * Math.pow(u / W2, 1.15) * Math.sin(2 * Math.PI * u / lambda - 2 * Math.PI * t / period);
    const f = (v) => +v.toFixed(2);
    const N = 24;
    const edge = (y, t, reverse) => {
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const u = W2 * i / N;
        pts.push("".concat(f(u), " ").concat(f(y + off(u, t))));
      }
      return reverse ? pts.reverse() : pts;
    };
    const bandD = (b, t) => 'path("M'.concat(edge(b * band, t).join("L"), "L").concat(edge((b + 1) * band, t, true).join("L"), 'Z")');
    const outlineD = (t) => 'path("M'.concat(edge(0, t).join("L"), "L").concat(edge(FH, t, true).join("L"), 'Z")');
    const times = [];
    for (let t = 0; t <= D; t += 100) times.push(t);
    bands.forEach((p, b) => p.setAttribute("d", bandD(b, 0).slice(6, -2)));
    outline.setAttribute("d", outlineD(0).slice(6, -2));
    bands.forEach((p, b) => HK.track(p, times.map((t) => ({ t, d: bandD(b, t) }))));
    HK.track(outline, times.map((t) => ({ t, d: outlineD(t) })));
    HK.track(chakra, times.map((t) => ({ t, transform: "translate(".concat(f(W2 / 2), "px, ").concat(f(FH / 2 + off(W2 / 2, t)), "px)") })));
    const out = (_d = o.out) != null ? _d : D - 3600;
    HK.track(hoist, [
      { t: 0, transform: "translateY(".concat(o.hoistFrom || 0, "px)"), opacity: 0 },
      { t: hoistAt - 250, transform: "translateY(".concat(o.hoistFrom || 0, "px)"), opacity: 0, ease: "out" },
      { t: hoistAt, transform: "translateY(".concat(o.hoistFrom || 0, "px)"), opacity: 1, ease: "inOut" },
      { t: hoistAt + hoistDur, transform: "translateY(0px)", opacity: 1 },
      { t: out, transform: "translateY(0px)", opacity: 1, ease: "out" },
      { t: out + 600, transform: "translateY(0px)", opacity: 0 }
    ]);
    return { width: W2, height: FH };
  };
  HK.cityLockup = function(code, height, color) {
    const T = 380;
    const top = -0.44 * T, bot = 0.56 * T;
    const bar = "M".concat(BAR.outer, " ").concat(top, "L").concat(BAR.inner, " ").concat(top, "L").concat(BAR.inner, " ").concat(BAR.wedgeTop, "L0 0L").concat(BAR.inner, " ").concat(BAR.wedgeBot, "L").concat(BAR.inner, " ").concat(bot, "L").concat(BAR.outer, " ").concat(bot, "Z");
    const w = -2 * BAR.outer;
    const svg = svgEl("svg", { viewBox: "".concat(BAR.outer, " ").concat(top, " ").concat(w, " ").concat(T), height, width: height * w / T });
    svg.style.cssText = "display:block;overflow:visible;fill:".concat(color);
    svg.append(svgEl("path", { d: bar }), svgEl("path", { d: bar, transform: "scale(-1 1)" }));
    const letters = [...code.toUpperCase()];
    const slot = (bot - 44) / letters.length;
    letters.forEach((ch, i) => {
      const t = svgEl("text", { x: 0, y: 44 + slot * (i + 1) - slot * 0.14, "text-anchor": "middle" });
      t.textContent = ch;
      t.style.cssText = 'font-family:"Bricolage Grotesque",sans-serif;font-stretch:75%;font-weight:700;font-size:'.concat(slot * 1.02, "px");
      svg.append(t);
    });
    return svg;
  };
  HK.propertyLockup = function(line1, line2, height, color) {
    const m = window.HAUS_LOGO["h-symbol"];
    const [x, y, w, h] = m.viewBox;
    const box = document.createElement("div");
    box.style.cssText = "display:flex;align-items:center;gap:".concat(height * 0.16, "px;color:").concat(color);
    const svg = svgEl("svg", { viewBox: "".concat(x, " ").concat(y, " ").concat(w, " ").concat(h), height, width: height * w / h });
    svg.style.cssText = "display:block;flex:none;fill:".concat(color);
    for (const p of m.parts) svg.append(svgEl("path", { d: p.d }));
    const txt = document.createElement("div");
    txt.style.cssText = 'font-family:"Bricolage Grotesque",sans-serif;font-stretch:75%;font-weight:700;text-transform:uppercase;font-size:'.concat(height / 1.84, "px;line-height:0.92;margin-top:").concat(height * 0.04, "px");
    txt.innerHTML = "<div></div><div></div>";
    txt.children[0].textContent = line1;
    txt.children[1].textContent = line2;
    box.append(svg, txt);
    return box;
  };
  HK.wordmark = function(height, color) {
    const m = window.HAUS_LOGO.wordmark;
    const [x, y, w, h] = m.viewBox;
    const svg = svgEl("svg", { viewBox: "".concat(x, " ").concat(y, " ").concat(w, " ").concat(h), height, width: height * w / h });
    svg.style.cssText = "display:block;fill:".concat(color);
    for (const p of m.parts) svg.append(svgEl("path", { d: p.d }));
    return svg;
  };
  HK.wordmarkWidth = (height) => {
    const [, , w, h] = window.HAUS_LOGO.wordmark.viewBox;
    return height * w / h;
  };
  window.HK = HK;
})();
