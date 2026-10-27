/* Front of Haus — motion kit.
 *
 * Every animated property is ONE Web Animation spanning the whole clip
 * (fill: both), built from time-stamped keyframes by HK.track(). That lets
 * tools/render_video.py pause the page and seek to any frame exactly
 * (window.__seek), so renders are frame-perfect and every clip can start and
 * end on the same closed-H frame for a seamless playlist.
 *
 * Signature move, "H doors": the two bars of the Haus+ H symbol (real logo
 * geometry from brand/logo/logo-data.js) glide apart into side rails
 * (guidelines p43/p45 "Logo Extended"), content sits between them, then they
 * glide back and re-form the H. The logo is only ever revealed by motion,
 * never faded (guidelines p22: do not reduce opacity).
 */
(function () {
  const W = 1920, H = 1080, M = 96;
  const NS = 'http://www.w3.org/2000/svg';
  const EASE = {
    out: 'cubic-bezier(0.22, 1, 0.36, 1)',
    in: 'cubic-bezier(0.55, 0, 0.85, 0.36)',
    inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
    linear: 'linear',
  };

  // Left bar of the H symbol in logo units, origin at the wedge tip (the H's
  // epicentre). Measured from H Symbol Design File (RGB).ai: bar 35.7 wide,
  // 250.8 tall, wedge from y -29.5 to +30.2 pointing inward to x = 0.
  const BAR = { outer: -62.1, inner: -26.38, top: -125.03, bottom: 125.72, wedgeTop: -29.48, wedgeBot: 30.22 };

  const HK = { W, H, M, EASE, BAR, params: new URLSearchParams(location.search) };

  HK.init = function ({ duration, fps = 25, poster }) {
    HK.duration = duration;
    window.COMP = { duration, fps, poster: poster ?? Math.round(duration / 2) };
  };

  HK.ready = async function () {
    await document.fonts.ready;
    window.COMP_READY = true;
  };

  // Renderer hook: freeze every animation at time t (ms).
  window.__seek = function (t) {
    for (const a of document.getAnimations()) {
      a.pause();
      a.currentTime = t;
    }
  };

  /* Time-stamped keyframes -> a single Animation over [0, duration].
   * frames: [{ t: ms, ease?: 'out'|'in'|'inOut'|css-easing, ...cssProps }]
   * `ease` shapes the segment that STARTS at that keyframe. */
  HK.track = function (el, frames, duration = HK.duration) {
    const f = frames.slice().sort((a, b) => a.t - b.t);
    if (f[0].t > 0) f.unshift({ ...f[0], t: 0, ease: 'linear' });
    if (f[f.length - 1].t < duration) f.push({ ...f[f.length - 1], t: duration });
    const kf = f.map(({ t, ease, ...props }) => ({
      ...props,
      offset: Math.min(1, Math.max(0, t / duration)),
      easing: EASE[ease] || ease || 'linear',
    }));
    return el.animate(kf, { duration, fill: 'both' });
  };

  const svgEl = (tag, attrs = {}) => {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  };

  /* H doors.
   * opts: scale (closed-H size = 250.8*scale px), color, open, openDur, extend,
   *       extendDur, retract, retractDur, close, closeDur (all ms)
   * Returns geometry for laying out content between the rails. */
  HK.doors = function (stage, o) {
    const s = o.scale ?? 1.3;
    const cx = W / 2, cy = H / 2;
    const railTop = o.railTop ?? M, railBot = o.railBottom ?? H - M;
    const openX = o.openX ?? M; // outer edge of the left rail when open
    const dx = openX - (cx + BAR.outer * s); // left door travel (negative)
    // Rails extend by moving the bar's top and bottom edges (one seamless path,
    // wedge geometry untouched) -- no scaling, no joins to anti-alias.
    const openTop = (railTop - cy) / s, openBot = (railBot - cy) / s;
    const barPath = (top, bot) => {
      const f = (v) => +v.toFixed(3);
      return `path("M${f(BAR.outer)} ${f(top)}L${f(BAR.inner)} ${f(top)}L${f(BAR.inner)} ${BAR.wedgeTop}L0 0L${f(BAR.inner)} ${BAR.wedgeBot}L${f(BAR.inner)} ${f(bot)}L${f(BAR.outer)} ${f(bot)}Z")`;
    };
    const t = {
      open: o.open, openDur: o.openDur ?? 1300,
      extend: o.extend ?? o.open + 650, extendDur: o.extendDur ?? 1100,
      retract: o.retract, retractDur: o.retractDur ?? 900,
      close: o.close ?? o.retract + 500, closeDur: o.closeDur ?? 1300,
    };

    const doors = ['left', 'right'].map((side) => {
      const sign = side === 'left' ? 1 : -1;
      const svg = svgEl('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` });
      svg.style.cssText = `position:absolute;inset:0;overflow:visible;fill:${o.color || 'var(--white)'};z-index:${o.z ?? 5}`;
      const move = svgEl('g');
      const place = svgEl('g', { transform: `translate(${cx} ${cy}) scale(${sign * s} ${s})` });
      const bar = svgEl('path');
      bar.style.d = barPath(BAR.top, BAR.bottom);
      place.append(bar);
      move.append(place);
      svg.append(move);
      stage.append(svg);

      const shut = 'translateX(0px)', open = `translateX(${sign * dx}px)`;
      HK.track(move, [
        { t: 0, transform: shut },
        { t: t.open, transform: shut, ease: 'inOut' },
        { t: t.open + t.openDur, transform: open },
        { t: t.close, transform: open, ease: 'inOut' },
        { t: t.close + t.closeDur, transform: shut },
      ]);
      const closedD = barPath(BAR.top, BAR.bottom), railD = barPath(openTop, openBot);
      HK.track(bar, [
        { t: 0, d: closedD },
        { t: t.extend, d: closedD, ease: 'out' },
        { t: t.extend + t.extendDur, d: railD },
        { t: t.retract, d: railD, ease: 'inOut' },
        { t: t.retract + t.retractDur, d: closedD },
      ]);
      return svg;
    });

    return {
      scale: s, timing: t, dx, doors,
      railInner: openX + (BAR.inner - BAR.outer) * s, // x of the left rail's inner edge
      tipX: openX - BAR.outer * s,                       // x of the left wedge tip when open
      railTop, railBot,
      closedTop: cy + BAR.top * s, closedBot: cy + BAR.bottom * s,
    };
  };

  /* The closed H exactly as HK.doors draws it at t=0 (same geometry, same
   * placement), without animation. The loop player keeps it underneath every
   * scene, so any gap between scenes shows the identical frame. */
  HK.closedH = function (stage, o = {}) {
    const s = o.scale ?? 1.3, cx = W / 2, cy = H / 2;
    const d = `M${BAR.outer} ${BAR.top}L${BAR.inner} ${BAR.top}L${BAR.inner} ${BAR.wedgeTop}L0 0L${BAR.inner} ${BAR.wedgeBot}L${BAR.inner} ${BAR.bottom}L${BAR.outer} ${BAR.bottom}Z`;
    for (const sign of [1, -1]) {
      const svg = svgEl('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` });
      svg.style.cssText = `position:absolute;inset:0;overflow:visible;fill:${o.color || 'var(--indigo)'}`;
      const g = svgEl('g', { transform: `translate(${cx} ${cy}) scale(${sign * s} ${s})` });
      g.append(svgEl('path', { d }));
      svg.append(g);
      stage.append(svg);
    }
  };

  /* A "room" revealed through the doorway: a panel whose edges track the
   * wedge tips as the doors open and the rails extend. Nested clips keep the
   * horizontal (door) and vertical (rail) easings independent and in sync. */
  HK.room = function (stage, d, o = {}) {
    const gap = o.gap ?? 40;
    const cx = W / 2;
    const t = d.timing;
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    outer.style.cssText = `position:absolute;inset:0;z-index:${o.z ?? 1}`;
    inner.style.cssText = `position:absolute;inset:0;background:${o.color || 'var(--concrete)'}`;
    outer.append(inner);
    stage.append(outer);
    const xShut = cx; // zero width
    const xOpen = d.tipX + gap;
    const hx = (x) => `inset(0px ${x}px 0px ${x}px)`;
    HK.track(outer, [
      { t: 0, clipPath: hx(xShut) },
      { t: t.open, clipPath: hx(xShut), ease: 'inOut' },
      { t: t.open + t.openDur, clipPath: hx(xOpen) },
      { t: t.close, clipPath: hx(xOpen), ease: 'inOut' },
      { t: t.close + t.closeDur, clipPath: hx(xShut) },
    ]);
    const vy = (top, bot) => `inset(${top}px 0px ${H - bot}px 0px)`;
    const shut = vy(d.closedTop, d.closedBot), open = vy(d.railTop, d.railBot);
    HK.track(inner, [
      { t: 0, clipPath: shut },
      { t: t.extend, clipPath: shut, ease: 'out' },
      { t: t.extend + t.extendDur, clipPath: open },
      { t: t.retract, clipPath: open, ease: 'inOut' },
      { t: t.retract + t.retractDur, clipPath: shut },
    ]);
    return { el: inner, left: xOpen, right: W - xOpen, top: d.railTop, bottom: d.railBot };
  };

  /* Text rises into place and leaves upward. */
  HK.rise = function (el, tIn, tOut, o = {}) {
    const dist = o.dist ?? 30, din = o.din ?? 900, dout = o.dout ?? 550;
    return HK.track(el, [
      { t: 0, opacity: 0, transform: `translateY(${dist}px)` },
      { t: tIn, opacity: 0, transform: `translateY(${dist}px)`, ease: 'out' },
      { t: tIn + din, opacity: 1, transform: 'translateY(0px)' },
      { t: tOut, opacity: 1, transform: 'translateY(0px)', ease: 'in' },
      { t: tOut + dout, opacity: 0, transform: `translateY(${-dist * 0.6}px)` },
    ]);
  };

  /* Logo reveal: slides up from behind a mask edge (no opacity change). */
  HK.maskUp = function (el, tIn, tOut, o = {}) {
    const din = o.din ?? 900, dout = o.dout ?? 700;
    return HK.track(el, [
      { t: 0, transform: 'translateY(110%)' },
      { t: tIn, transform: 'translateY(110%)', ease: 'out' },
      { t: tIn + din, transform: 'translateY(0%)' },
      { t: tOut, transform: 'translateY(0%)', ease: 'inOut' },
      { t: tOut + dout, transform: 'translateY(110%)' },
    ]);
  };

  /* Monoline illustration draws itself, then fades with the content. */
  HK.draw = function (paths, tStart, dur, stagger, tOut, dout = 600) {
    paths.forEach((p, i) => {
      p.setAttribute('pathLength', '1');
      p.style.strokeDasharray = '1 1';
      const t0 = tStart + i * stagger;
      HK.track(p, [
        { t: 0, strokeDashoffset: 1, opacity: 0 },
        { t: t0, strokeDashoffset: 1, opacity: 1, ease: 'inOut' },
        { t: t0 + dur, strokeDashoffset: 0, opacity: 1 },
        { t: tOut, strokeDashoffset: 0, opacity: 1, ease: 'out' },
        { t: tOut + dout, strokeDashoffset: 0, opacity: 0 },
      ]);
    });
  };

  /* India's national flag, drawn to the Flag Code of India 2002, Part I: 3:2,
   * three equal bands (India saffron, white, India green), navy-blue Ashoka
   * Chakra with 24 equally spaced spokes at the centre of the white band
   * (chakra geometry follows the standard vector flag: diameter 0.8 x band).
   * Use with dignity (Flag Code 2.1-2.2): never as decoration or a backdrop,
   * never with lettering or a logo on it, saffron always up, placed so nothing
   * sits above it. It is hoisted up its pole, then waves gently from the hoist.
   * o: x, y (hoist top-left, parent units), w (flag length), hoistFrom (units
   *    below final position), hoistAt, hoistDur, out (ms content leaves),
   *    outline (colour), outlineWidth (parent units). */
  HK.flag = function (parent, o) {
    const W = o.w, FH = (W * 2) / 3, band = FH / 3, D = HK.duration;
    const COLOURS = { saffron: '#FF9933', white: '#FFFFFF', green: '#138808', navy: '#000080' };
    const root = svgEl('g', { transform: `translate(${o.x} ${o.y})` });
    const hoist = svgEl('g');
    const bands = [COLOURS.saffron, COLOURS.white, COLOURS.green].map((fill) => svgEl('path', { fill, stroke: 'none' }));
    const outline = svgEl('path', { fill: 'none', stroke: o.outline || 'currentColor', 'stroke-width': o.outlineWidth || 2, 'stroke-linejoin': 'round' });

    // Ashoka Chakra: navy ring, 24 tapered spokes, 24 rim dots, hub (unit radius 20)
    const chakra = svgEl('g');
    const k = (band * 0.4) / 20;
    const wheel = svgEl('g', { transform: `scale(${k})`, fill: COLOURS.navy, stroke: 'none' });
    wheel.append(svgEl('circle', { r: 20 }), svgEl('circle', { r: 17.5, fill: COLOURS.white }), svgEl('circle', { r: 3.5 }));
    for (let i = 0; i < 24; i++) {
      wheel.append(svgEl('path', { d: 'M0 17.5L0.6 7L0 2L-0.6 7Z', transform: `rotate(${i * 15})` }));
      wheel.append(svgEl('circle', { r: 0.875, transform: `rotate(${i * 15 + 7.5}) translate(0 17.5)` }));
    }
    chakra.append(wheel);
    hoist.append(...bands, chakra, outline);
    root.append(hoist);
    parent.append(root);

    // Gentle wave: the hoist edge is fixed to the pole, amplitude grows to the fly end
    const hoistAt = o.hoistAt ?? 2600, hoistDur = o.hoistDur ?? 1800;
    const ramp = (t) => { const x = Math.min(1, Math.max(0, (t - hoistAt) / hoistDur)); return x * x * (3 - 2 * x); };
    const period = o.period ?? 2600, lambda = W * 0.95, A = FH * 0.05;
    const off = (u, t) => A * ramp(t) * Math.pow(u / W, 1.15) * Math.sin((2 * Math.PI * u) / lambda - (2 * Math.PI * t) / period);
    const f = (v) => +v.toFixed(2);
    const N = 24;
    const edge = (y, t, reverse) => {
      const pts = [];
      for (let i = 0; i <= N; i++) { const u = (W * i) / N; pts.push(`${f(u)} ${f(y + off(u, t))}`); }
      return reverse ? pts.reverse() : pts;
    };
    const bandD = (b, t) => `path("M${edge(b * band, t).join('L')}L${edge((b + 1) * band, t, true).join('L')}Z")`;
    const outlineD = (t) => `path("M${edge(0, t).join('L')}L${edge(FH, t, true).join('L')}Z")`;
    const times = [];
    for (let t = 0; t <= D; t += 100) times.push(t);
    bands.forEach((p, b) => HK.track(p, times.map((t) => ({ t, d: bandD(b, t) }))));
    HK.track(outline, times.map((t) => ({ t, d: outlineD(t) })));
    HK.track(chakra, times.map((t) => ({ t, transform: `translate(${f(W / 2)}px, ${f(FH / 2 + off(W / 2, t))}px)` })));

    // Hoisting: appears at the foot of the pole, rises to the top; leaves with the content
    const out = o.out ?? D - 3600;
    HK.track(hoist, [
      { t: 0, transform: `translateY(${o.hoistFrom || 0}px)`, opacity: 0 },
      { t: hoistAt - 250, transform: `translateY(${o.hoistFrom || 0}px)`, opacity: 0, ease: 'out' },
      { t: hoistAt, transform: `translateY(${o.hoistFrom || 0}px)`, opacity: 1, ease: 'inOut' },
      { t: hoistAt + hoistDur, transform: 'translateY(0px)', opacity: 1 },
      { t: out, transform: 'translateY(0px)', opacity: 1, ease: 'out' },
      { t: out + 600, transform: 'translateY(0px)', opacity: 0 },
    ]);
    return { width: W, height: FH };
  };

  /* City lock-up (guidelines p26, "Category Identity"): the H with its
   * epicentre moved up and the city code stacked in caps between the bars. */
  HK.cityLockup = function (code, height, color) {
    const T = 380; // lock-up height in logo units (taller than the 250.8 H)
    const top = -0.44 * T, bot = 0.56 * T;
    const bar = `M${BAR.outer} ${top}L${BAR.inner} ${top}L${BAR.inner} ${BAR.wedgeTop}L0 0L${BAR.inner} ${BAR.wedgeBot}L${BAR.inner} ${bot}L${BAR.outer} ${bot}Z`;
    const w = -2 * BAR.outer;
    const svg = svgEl('svg', { viewBox: `${BAR.outer} ${top} ${w} ${T}`, height, width: (height * w) / T });
    svg.style.cssText = `display:block;overflow:visible;fill:${color}`;
    svg.append(svgEl('path', { d: bar }), svgEl('path', { d: bar, transform: 'scale(-1 1)' }));
    const letters = [...code.toUpperCase()];
    const slot = (bot - 44) / letters.length;
    letters.forEach((ch, i) => {
      const t = svgEl('text', { x: 0, y: 44 + slot * (i + 1) - slot * 0.14, 'text-anchor': 'middle' });
      t.textContent = ch;
      t.style.cssText = `font-family:"Bricolage Grotesque",sans-serif;font-stretch:75%;font-weight:700;font-size:${slot * 1.02}px`;
      svg.append(t);
    });
    return svg;
  };

  /* Property lock-up (guidelines p27): the H symbol beside the name in two
   * caps lines, e.g. SAKET / NEW DELHI. Returns an HTML element. */
  HK.propertyLockup = function (line1, line2, height, color) {
    const m = window.HAUS_LOGO['h-symbol'];
    const [x, y, w, h] = m.viewBox;
    const box = document.createElement('div');
    box.style.cssText = `display:flex;align-items:center;gap:${height * 0.16}px;color:${color}`;
    const svg = svgEl('svg', { viewBox: `${x} ${y} ${w} ${h}`, height, width: (height * w) / h });
    svg.style.cssText = `display:block;flex:none;fill:${color}`;
    for (const p of m.parts) svg.append(svgEl('path', { d: p.d }));
    const txt = document.createElement('div');
    txt.style.cssText = `font-family:"Bricolage Grotesque",sans-serif;font-stretch:75%;font-weight:700;text-transform:uppercase;font-size:${height / 1.84}px;line-height:0.92;margin-top:${height * 0.04}px`;
    txt.innerHTML = `<div></div><div></div>`;
    txt.children[0].textContent = line1;
    txt.children[1].textContent = line2;
    box.append(svg, txt);
    return box;
  };

  /* The HAUS+ wordmark as inline SVG (recoloured via CSS color). */
  HK.wordmark = function (height, color) {
    const m = window.HAUS_LOGO.wordmark;
    const [x, y, w, h] = m.viewBox;
    const svg = svgEl('svg', { viewBox: `${x} ${y} ${w} ${h}`, height, width: (height * w) / h });
    svg.style.cssText = `display:block;fill:${color}`;
    for (const p of m.parts) svg.append(svgEl('path', { d: p.d }));
    return svg;
  };

  HK.wordmarkWidth = (height) => {
    const [, , w, h] = window.HAUS_LOGO.wordmark.viewBox;
    return (height * w) / h;
  };

  window.HK = HK;
})();
