(function() {
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const abs = (cls, text) => el("div", "abs " + cls, text);
  const rich = (line) => {
    const span = el("span", "line");
    span.style.display = "block";
    const runs = Array.isArray(line) ? line : [line];
    for (const r of runs) {
      if (r == null) continue;
      if (typeof r === "string") span.append(document.createTextNode(r));
      else if (r.italic) span.append(el("span", "it", r.italic));
    }
    return span;
  };
  const disposer = (root) => ({
    dispose() {
      if (root.getAnimations) root.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      root.remove();
    }
  });
  const colours = (M) => M.companies.map((c) => c.colour);
  const companyIndex = (M, id) => M.companies.findIndex((c) => c.id === id);
  const slices = (from, to, n, gap = 600) => {
    const len = (to - from) / n;
    return [...Array(n)].map((_, k) => [from + k * len, k === n - 1 ? to : from + (k + 1) * len - gap]);
  };
  function buildFamily(root, s, M) {
    const D = s.ms;
    HK.init({ duration: D, poster: 4200 });
    root.classList.add("family-scene");
    const house = FO.house(root, colours(M));
    if (s.headline) {
      const above = abs("serif inscription above", s.headline);
      root.append(above);
      HK.rise(above, 900, 6e3);
    }
    if (s.sub) {
      const below = abs("serif inscription below it", s.sub);
      root.append(below);
      HK.rise(below, 1400, 6080);
    }
    const spreadAt = 6800, spreadDur = 1500, backAt = D - 2700, backDur = 1500;
    const pitch = 460;
    const targets = M.companies.map((_, i) => 960 + (i - (M.companies.length - 1) / 2) * pitch);
    house.cols.forEach((c, i) => {
      const dx = targets[i] - FO.colCentre(i);
      HK.track(c, [
        { t: 0, transform: "translateX(0px)" },
        { t: spreadAt, transform: "translateX(0px)", ease: "inOut" },
        { t: spreadAt + spreadDur, transform: "translateX(".concat(dx, "px)") },
        { t: backAt, transform: "translateX(".concat(dx, "px)"), ease: "inOut" },
        { t: backAt + backDur, transform: "translateX(0px)" }
      ]);
    });
    const lb = FO.lintelBox("top");
    const wide = targets[targets.length - 1] - targets[0] + FO.COL.w + 2 * FO.LINTEL.over;
    const k = wide / lb.width;
    house.lintels.forEach((l) => {
      l.style.transformOrigin = "50% 50%";
      HK.track(l, [
        { t: 0, transform: "scaleX(1)" },
        { t: spreadAt, transform: "scaleX(1)", ease: "inOut" },
        { t: spreadAt + spreadDur, transform: "scaleX(".concat(k, ")") },
        { t: backAt, transform: "scaleX(".concat(k, ")"), ease: "inOut" },
        { t: backAt + backDur, transform: "scaleX(1)" }
      ]);
    });
    M.companies.forEach((c, i) => {
      const lab = abs("house-label");
      lab.style.left = targets[i] + "px";
      lab.append(el("div", "label", c.sector));
      const name = el("div", "name");
      c.name.split(" ").forEach((w, j) => {
        if (j) name.append(el("br"));
        name.append(document.createTextNode(w));
      });
      lab.append(name);
      root.append(lab);
      HK.rise(lab, spreadAt + 900 + i * 160, backAt - 800 + i * 60);
    });
    return disposer(root);
  }
  function buildChapter(root, s, M) {
    const D = s.ms;
    HK.init({ duration: D, poster: 5600 });
    root.classList.add("chapter-scene");
    FO.house(root, colours(M));
    const i = companyIndex(M, s.company);
    const { el: r, timing: t } = FO.room(root, i, M.companies[i].colour);
    r.classList.add("chapter");
    r.style.setProperty("--accent", s.accent || "var(--white)");
    const tin = t.contentIn, out = t.contentOut;
    if (s.logo) {
      const wrap = abs("logo mask");
      const img = new Image();
      img.src = s.logo.src;
      img.style.height = s.logo.height + "px";
      img.style.width = Math.round(s.logo.height * s.logo.w / s.logo.h) + "px";
      wrap.append(img);
      r.append(wrap);
      HK.maskUp(img, tin, out + 200);
    }
    const tr = abs("topright");
    if (s.eyebrow) tr.append(el("div", "label eyebrow", s.eyebrow));
    if (s.web) tr.append(el("div", "web", s.web));
    r.append(tr);
    HK.rise(tr, tin + 200, out);
    if (s.headline) {
      const h = abs("serif headline");
      s.headline.forEach((line) => h.append(rich(line)));
      r.append(h);
      h.querySelectorAll(".line").forEach((ln, k) => HK.rise(ln, tin + 350 + k * 160, out + k * 60));
    }
    const nLines = (s.headline || []).length;
    const beatTop = 330 + nLines * 160 + (nLines > 1 ? 70 : 140);
    const beats = (s.beats || []).filter((b) => b.type === "line" ? b.text : (b.items || []).length);
    const times = slices(tin + 2100, out, beats.length || 1);
    beats.forEach((b, k) => {
      const [bin, bout] = times[k];
      if (b.type === "line") {
        const e = abs("beat line", b.text);
        e.style.top = beatTop + "px";
        r.append(e);
        HK.rise(e, bin, bout);
      } else {
        const row = abs("beat stats");
        row.style.top = beatTop + "px";
        r.append(row);
        b.items.forEach((it, j) => {
          const st = el("div", "stat");
          const v = el("div", "value");
          it.value.split(/([~+])/).forEach((part) => {
            if (part) v.append(/^[~+]$/.test(part) ? el("span", "sym", part) : document.createTextNode(part));
          });
          st.append(v, el("div", "label", it.label));
          row.append(st);
          HK.rise(st, bin + j * 180, bout + j * 60);
        });
      }
    });
    if (s.motif === "mountains") mountains(r, tin + 600, out);
    return disposer(root);
  }
  function mountains(r, tin, out) {
    const NS = "http://www.w3.org/2000/svg";
    const wrap = abs("motif");
    wrap.style.right = "192px";
    wrap.style.bottom = "192px";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 480 200");
    svg.setAttribute("width", "480");
    svg.setAttribute("height", "200");
    const sun = document.createElementNS(NS, "circle");
    Object.entries({ cx: 368, cy: 34, r: 28, fill: "var(--endurance-accent)" }).forEach(([k, v]) => sun.setAttribute(k, v));
    const ridge = document.createElementNS(NS, "path");
    Object.entries({
      d: "M4 196 L104 92 L150 134 L238 34 L300 104 L340 78 L452 196",
      fill: "none",
      stroke: "var(--endurance-grey)",
      "stroke-width": 6,
      "stroke-linejoin": "round",
      "stroke-linecap": "round"
    }).forEach(([k, v]) => ridge.setAttribute(k, v));
    svg.append(sun, ridge);
    wrap.append(svg);
    r.append(wrap);
    HK.draw([ridge], tin, 1800, 0, out);
    HK.track(sun, [
      { t: 0, transform: "translateY(70px)", opacity: 0 },
      { t: tin + 1200, transform: "translateY(70px)", opacity: 0, ease: "out" },
      { t: tin + 3200, transform: "translateY(0px)", opacity: 1 },
      { t: out, transform: "translateY(0px)", opacity: 1, ease: "in" },
      { t: out + 600, transform: "translateY(0px)", opacity: 0 }
    ]);
  }
  function buildSaga(root, s, M) {
    const D = s.ms;
    HK.init({ duration: D, poster: 5200 });
    root.classList.add("saga-scene");
    FO.house(root, colours(M));
    const i = companyIndex(M, s.company);
    const { el: r, timing: t } = FO.room(root, i, M.companies[i].colour);
    r.classList.add("saga");
    const tin = t.contentIn, out = t.contentOut;
    const beats = (s.beats || []).filter((b) => b.photo);
    const photoEnd = out - 5800;
    const times = slices(tin + 400, photoEnd, beats.length || 1, 0);
    const RW = 1728, RH = 888;
    beats.forEach((b, k) => {
      var _a;
      const [p0, p1] = times[k];
      const frame = abs("photo");
      frame.style.left = "96px";
      frame.style.top = "96px";
      const img = new Image();
      img.src = b.photo.src;
      const a = b.photo.w / b.photo.h;
      const iw = Math.max(RH * a, RW + 160), ih = iw / a;
      Object.assign(img.style, { width: iw + "px", height: ih + "px", top: (RH - ih) * ((_a = b.anchor_y) != null ? _a : 0.5) + "px" });
      frame.append(img);
      r.append(frame);
      const fin = k === 0 ? tin - 600 : p0 - 500, fout = k === beats.length - 1 ? photoEnd : p1 + 500;
      HK.track(frame, [
        { t: 0, opacity: 0 },
        { t: fin, opacity: 0, ease: "inOut" },
        { t: fin + 1e3, opacity: 1 },
        { t: fout, opacity: 1, ease: "inOut" },
        { t: fout + 900, opacity: 0 }
      ]);
      const range = Math.min(iw - RW, 200);
      const start = -(iw - RW - range) / 2;
      HK.track(img, [
        { t: 0, transform: "translateX(".concat(start, "px)") },
        { t: fin, transform: "translateX(".concat(start, "px)") },
        { t: fout + 900, transform: "translateX(".concat(start - range, "px)") }
      ]);
    });
    const block = abs("block");
    block.style.width = "1000px";
    if (s.eyebrow) block.append(el("div", "label", s.eyebrow));
    const swap = el("div", "swap");
    block.append(swap);
    beats.forEach((b, k) => {
      const part = el("div", k ? "b2" : "b1");
      if (b.headline) part.append(el("div", "h", b.headline));
      if (b.line) part.append(el("div", "l", b.line));
      if (b.caption || s.caption) part.append(el("div", "cap", b.caption || s.caption));
      swap.append(part);
      const [p0, p1] = times[k];
      HK.rise(part, k === 0 ? tin + 1e3 : p0 + 300, k === beats.length - 1 ? photoEnd - 900 : p1 - 200, { dist: 16 });
    });
    r.append(block);
    HK.rise(block, tin + 700, photoEnd - 500, { dist: 0, din: 700 });
    const dests = (s.destinations || []).filter((d) => d.place);
    if (dests.length) {
      const d0 = photoEnd + 700;
      const head = abs("dest-head label", "Saga Hotels \xB7 Destinations");
      r.append(head);
      HK.rise(head, d0, out);
      const row = abs("dests");
      r.append(row);
      dests.forEach((d, k) => {
        const e = el("div", "dest");
        e.append(el("div", "rule"), el("div", "place", d.place));
        if (d.line) e.append(el("div", "line", d.line));
        row.append(e);
        HK.rise(e, d0 + 300 + k * 220, out + k * 60);
      });
    }
    return disposer(root);
  }
  const CITY = { DEL: "New Delhi", BLR: "Bengaluru", MUM: "Mumbai", HYD: "Hyderabad", GUR: "Gurugram", CHE: "Chennai" };
  function buildHaus(root, s, M) {
    var _a;
    const D = s.ms;
    HK.init({ duration: D, poster: 4800 });
    root.classList.add("haus-scene");
    FO.house(root, colours(M));
    const i = companyIndex(M, s.company);
    const { el: r, timing: t } = FO.room(root, i, M.companies[i].colour);
    r.classList.add("haus");
    const tin = t.contentIn, out = t.contentOut;
    const wmH = 64, wmW = HK.wordmarkWidth(wmH);
    const wm = abs("wm mask");
    Object.assign(wm.style, { width: wmW + "px", height: wmH + "px" });
    const mark = HK.wordmark(wmH, "var(--white)");
    wm.append(mark);
    r.append(wm);
    HK.maskUp(mark, tin, out + 200);
    const tr = abs("topright");
    if (s.eyebrow) tr.append(el("div", "hlabel", s.eyebrow));
    if (s.web) tr.append(el("div", "web", s.web));
    r.append(tr);
    HK.rise(tr, tin + 200, out);
    const [b1, b2, b3] = slices(tin + 300, out, 3);
    if (s.headline) {
      const h = abs("display headline");
      s.headline.forEach((line, k) => {
        const ln = rich(line);
        if (k === s.headline.length - 1 && s.headline.length > 1) ln.classList.add("accent");
        h.append(ln);
      });
      r.append(h);
      h.querySelectorAll(".line").forEach((ln, k) => HK.rise(ln, b1[0] + k * 160, b1[1] + k * 60));
    }
    if (s.saket) {
      const sk = abs("saket");
      const lockWrap = el("div", "mask");
      const lock = HK.propertyLockup("Saket", "New Delhi", 150, "var(--white)");
      lockWrap.append(lock);
      sk.append(lockWrap);
      if (s.saket.line) sk.append(el("div", "l", s.saket.line));
      if (typeof s.saket.when === "string") sk.append(el("div", "when", s.saket.when));
      r.append(sk);
      HK.maskUp(lock, b2[0] + 200, b2[1] - 300, { din: 1e3 });
      sk.querySelectorAll(".l, .when").forEach((e, k) => HK.rise(e, b2[0] + 600 + k * 160, b2[1] + k * 60));
      if (s.saket.photo) {
        const shot = abs("shot");
        const img = new Image();
        img.src = s.saket.photo.src;
        img.style.objectPosition = "".concat(Math.round(((_a = s.saket.anchor) != null ? _a : 0.5) * 100), "% 50%");
        shot.append(img);
        if (s.saket.caption) shot.append(el("div", "cap", s.saket.caption));
        r.append(shot);
        HK.rise(shot, b2[0], b2[1] + 100, { dist: 0, din: 900 });
      }
    }
    if (s.next && (s.next.cities || []).length) {
      const head = abs("next-head hlabel", s.next.label);
      r.append(head);
      HK.rise(head, b3[0], b3[1]);
      const row = abs("next");
      r.append(row);
      s.next.cities.filter((c) => c.centres).forEach((c, k) => {
        const city = el("div", "city");
        const m = el("div", "mark");
        const lock = HK.cityLockup(c.code, 300, "var(--white)");
        m.append(lock);
        const names = el("div", "names");
        names.append(el("div", "cname", CITY[c.code] || c.code));
        c.centres.split(" \xB7 ").forEach((n) => names.append(el("div", null, n)));
        city.append(m, names);
        row.append(city);
        HK.maskUp(lock, b3[0] + 300 + k * 260, b3[1] - 200 + k * 60, { din: 1e3 });
        HK.rise(names, b3[0] + 700 + k * 260, b3[1] + k * 60);
      });
    }
    return disposer(root);
  }
  function buildClose(root, s, M) {
    const D = s.ms;
    HK.init({ duration: D, poster: 4500 });
    root.classList.add("close-scene");
    FO.house(root, colours(M));
    const outAt = D - 2100;
    if (s.headline) {
      const h = abs("serif inscription above");
      s.headline.forEach((line) => h.append(rich(line)));
      root.append(h);
      HK.rise(h, 800, outAt);
    }
    if (s.line) {
      const l = abs("sans close-line", s.line);
      root.append(l);
      HK.rise(l, 1400, outAt + 60);
    }
    if (s.address) {
      const a = abs("label close-address", s.address);
      root.append(a);
      HK.rise(a, 1800, outAt + 120);
    }
    return disposer(root);
  }
  function buildWish(root, s, M) {
    var _a;
    const D = s.ms;
    HK.init({ duration: D, poster: 5200 });
    root.classList.add("wish-scene");
    FO.house(root, colours(M));
    const mid = FO.W / 2;
    const { el: r, timing: t } = FO.room(root, null, "var(--ink)", { x0: mid, x1: mid });
    r.classList.add("wish");
    r.style.setProperty("--accent", s.accent || "var(--white)");
    const tin = t.contentIn, out = t.contentOut;
    const artOut = tin + Math.round((out - tin) * 0.55);
    if (s.art) {
      const RW = 1728, RH = 888;
      const frame = abs("art");
      const img = new Image();
      img.src = s.art.src;
      const a = s.art.w / s.art.h;
      const iw = Math.max(RH * a, RW + 160), ih = iw / a;
      Object.assign(img.style, { width: iw + "px", height: ih + "px", top: (RH - ih) * ((_a = s.art_anchor_y) != null ? _a : 0.5) + "px" });
      frame.append(img);
      r.append(frame);
      HK.track(frame, [
        { t: 0, opacity: 0 },
        { t: tin - 600, opacity: 0, ease: "inOut" },
        { t: tin + 400, opacity: 1 },
        { t: artOut, opacity: 1, ease: "inOut" },
        { t: artOut + 900, opacity: 0 }
      ]);
      const range = Math.min(iw - RW, 160);
      HK.track(img, [
        { t: 0, transform: "translateX(0px)" },
        { t: tin - 600, transform: "translateX(0px)" },
        { t: artOut + 900, transform: "translateX(".concat(-range, "px)") }
      ]);
    }
    if (s.motif === "flag") {
      const NS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 ".concat(FO.W, " ").concat(FO.H));
      svg.setAttribute("width", FO.W);
      svg.setAttribute("height", FO.H);
      svg.style.cssText = "position:absolute;top:0;right:0;bottom:0;left:0;overflow:visible";
      const poleX = 1296, top = 236, foot = 884, fw = 480;
      const pole = document.createElementNS(NS, "g");
      const rod = document.createElementNS(NS, "rect");
      Object.entries({ x: poleX - 5, y: top, width: 10, height: foot - top, rx: 3, fill: "#E9E4DA" }).forEach(([k, v]) => rod.setAttribute(k, v));
      const knob = document.createElementNS(NS, "circle");
      Object.entries({ cx: poleX, cy: top - 8, r: 10, fill: "#E2B04A" }).forEach(([k, v]) => knob.setAttribute(k, v));
      pole.append(rod, knob);
      const flag = document.createElementNS(NS, "g");
      svg.append(pole, flag);
      r.append(svg);
      HK.rise(pole, tin - 300, artOut, { dist: 0, din: 900 });
      HK.flag(flag, { x: poleX + 5, y: top + 6, w: fw, hoistFrom: foot - top - 6 - fw * 2 / 3, hoistAt: tin + 300, hoistDur: 2e3, out: artOut, outline: "none" });
    }
    const g = abs("greet");
    if (s.greet_top) g.style.top = s.greet_top + "px";
    const head = el("div", "serif headline");
    if (s.headline_size) head.style.fontSize = s.headline_size + "px";
    (s.headline || []).forEach((line) => head.append(rich(line)));
    g.append(head);
    const locals = s.locals || [];
    if (locals.length) {
      const box = el("div", "locals n" + locals.length);
      locals.forEach((loc) => {
        const l = el("div", "local font-" + (loc.font || "deva"), loc.text);
        l.lang = loc.lang || "";
        if (s.local_size) l.style.fontSize = s.local_size + "px";
        box.append(l);
      });
      g.append(box);
    }
    r.append(g);
    [...head.children, ...g.querySelectorAll(".local")].forEach((e, k) => HK.rise(e, tin + 500 + k * 160, artOut - 500 + k * 60));
    const b2 = artOut + 700;
    const so = abs("signoff");
    if (s.line) so.append(el("div", "serif sline", s.line));
    if (s.signoff) so.append(el("div", "label slabel", s.signoff));
    const row = el("div", "logos");
    (s.logos || M.wish_logos || []).forEach((c, k) => {
      if (k) row.append(el("div", "sep"));
      const cell = el("div", "mask lg " + c.id);
      let mark;
      if (c.wordmark) {
        mark = HK.wordmark(c.height, "var(--white)");
        cell.style.height = c.height + "px";
      } else {
        mark = new Image();
        mark.src = c.logo.src;
        mark.style.height = c.logo.height + "px";
        mark.style.width = Math.round(c.logo.height * c.logo.w / c.logo.h) + "px";
      }
      cell.append(mark);
      row.append(cell);
    });
    so.append(row);
    r.append(so);
    so.querySelectorAll(".sline, .slabel").forEach((e, k) => HK.rise(e, b2 + k * 250, out + k * 60));
    row.querySelectorAll(".lg > *").forEach((m, k) => HK.maskUp(m, b2 + 600 + k * 200, out - 100 + k * 60));
    row.querySelectorAll(".sep").forEach((e, k) => HK.rise(e, b2 + 900 + k * 200, out, { dist: 0 }));
    return disposer(root);
  }
  const BUILDERS = { family: buildFamily, chapter: buildChapter, saga: buildSaga, haus: buildHaus, close: buildClose, wish: buildWish };
  window.buildScene = function(root, scene, manifest) {
    const b = BUILDERS[scene.kind];
    if (!b) throw new Error("Unknown scene kind: " + scene.kind);
    return b(root, scene, manifest);
  };
})();
