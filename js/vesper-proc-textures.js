/**
 * Vesper procedural celestial textures (v80+) — higher-res canvas + height→normal.
 * Layered geology for dwarfs/moons/asteroids lacking NASA 2K. Original art.
 */
(function () {
  "use strict";

  function seeded(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function hash2(ix, iy, seed) {
    return seeded(ix * 127.1 + iy * 311.7 + seed * 74.7);
  }
  function fade(t) {
    return t * t * (3 - 2 * t);
  }
  function noise2(x, y, seed) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = fade(x - x0);
    const fy = fade(y - y0);
    const a = hash2(x0, y0, seed);
    const b = hash2(x0 + 1, y0, seed);
    const c = hash2(x0, y0 + 1, seed);
    const d = hash2(x0 + 1, y0 + 1, seed);
    return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
  }
  function fbm(x, y, seed, oct) {
    let v = 0, a = 0.5, f = 1, n = 0;
    const o = oct || 6;
    for (let i = 0; i < o; i++) {
      v += a * noise2(x * f, y * f, seed + i * 19.1);
      n += a;
      a *= 0.5;
      f *= 2.03;
    }
    return v / (n || 1);
  }
  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function mixRgb(a, b, t) {
    return {
      r: lerp(a.r, b.r, t) | 0,
      g: lerp(a.g, b.g, t) | 0,
      b: lerp(a.b, b.b, t) | 0,
    };
  }

  function paintBody(opts) {
    const w = opts.size || 1024;
    const h = w;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    const cols = (opts.palette || ["#888888", "#666666", "#444444"]).map(hexToRgb);
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const height = new Float32Array(w * h);
    const seed = opts.seed || 1;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const u = x / w;
        const v = y / h;
        let n = fbm(u * 7, v * 3.5, seed, 6);
        // latitude bands for ice/gas-ish
        if (opts.bands) {
          n = n * 0.65 + 0.35 * (0.5 + 0.5 * Math.sin(v * Math.PI * opts.bands + n * 2));
        }
        height[y * w + x] = n;
        const t = Math.min(1, Math.max(0, n));
        const i0 = Math.min(cols.length - 2, Math.floor(t * (cols.length - 1)));
        const ft = t * (cols.length - 1) - i0;
        const rgb = mixRgb(cols[i0], cols[i0 + 1], ft);
        const i = (y * w + x) * 4;
        d[i] = rgb.r;
        d[i + 1] = rgb.g;
        d[i + 2] = rgb.b;
        d[i + 3] = 255;
      }
    }

    // Polar frost / ice caps (physics-y for icy worlds)
    if (opts.polarCaps) {
      const cap = opts.polarCaps; // 0..1 strength
      for (let y = 0; y < h; y++) {
        const v = y / h;
        const pole = Math.min(v, 1 - v); // 0 at poles
        const frost = Math.max(0, (0.18 - pole) / 0.18) * cap;
        if (frost <= 0) continue;
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const n = fbm(x / w * 4, v * 2, seed + 9, 3);
          const f = frost * (0.7 + 0.3 * n);
          d[i] = (d[i] * (1 - f) + 235 * f) | 0;
          d[i + 1] = (d[i + 1] * (1 - f) + 240 * f) | 0;
          d[i + 2] = (d[i + 2] * (1 - f) + 248 * f) | 0;
          height[y * w + x] = Math.min(1, height[y * w + x] + f * 0.08);
        }
      }
    }

    // Craters carved into color + height
    const nC = opts.craters != null ? opts.craters : 70;
    for (let i = 0; i < nC; i++) {
      const cx = seeded(i * 3.1 + seed) * w;
      const cy = seeded(i * 5.7 + seed + 2) * h;
      const rad = (3 + seeded(i * 9 + seed) * (opts.craterMax || 42)) * (w / 1024);
      const dark = opts.craterDark !== false;
      for (let yy = Math.floor(cy - rad); yy <= cy + rad; yy++) {
        for (let xx = Math.floor(cx - rad); xx <= cx + rad; xx++) {
          const x = ((xx % w) + w) % w;
          const y = Math.min(h - 1, Math.max(0, yy));
          const dx = xx - cx;
          const dy = yy - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > rad) continue;
          const rim = Math.abs(dist - rad * 0.82) < rad * 0.08;
          const bowl = dist < rad * 0.82;
          const idx = y * w + x;
          const pi = idx * 4;
          if (bowl) {
            const fall = 1 - dist / (rad * 0.82);
            height[idx] *= 1 - fall * 0.35;
            const k = dark ? 0.55 + fall * 0.2 : 0.75;
            d[pi] = (d[pi] * k) | 0;
            d[pi + 1] = (d[pi + 1] * k) | 0;
            d[pi + 2] = (d[pi + 2] * k) | 0;
          } else if (rim) {
            height[idx] = Math.min(1, height[idx] + 0.12);
            d[pi] = Math.min(255, d[pi] + 28);
            d[pi + 1] = Math.min(255, d[pi + 1] + 24);
            d[pi + 2] = Math.min(255, d[pi + 2] + 20);
          }
        }
      }
    }

    // Named feature
    if (opts.feature) {
      const f = opts.feature;
      const fx = f.x * w, fy = f.y * h, rx = f.rx * w, ry = f.ry * h;
      const frgb = hexToRgb((f.hex || "#2a241c").replace("rgba", "#2a241c").slice(0, 7) || "#2a241c");
      // parse simple rgba in color string
      let cr = 40, cg = 36, cb = 32, ca = 0.45;
      if (f.color && f.color.indexOf("rgba") === 0) {
        const m = f.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (m) {
          cr = +m[1]; cg = +m[2]; cb = +m[3]; ca = +m[4];
        }
      }
      for (let yy = 0; yy < h; yy++) {
        for (let xx = 0; xx < w; xx++) {
          const dx = (xx - fx) / rx;
          const dy = (yy - fy) / ry;
          if (dx * dx + dy * dy > 1) continue;
          const fall = 1 - Math.sqrt(dx * dx + dy * dy);
          const idx = yy * w + xx;
          const pi = idx * 4;
          d[pi] = (d[pi] * (1 - ca * fall) + cr * ca * fall) | 0;
          d[pi + 1] = (d[pi + 1] * (1 - ca * fall) + cg * ca * fall) | 0;
          d[pi + 2] = (d[pi + 2] * (1 - ca * fall) + cb * ca * fall) | 0;
          height[idx] *= 1 - fall * 0.2;
        }
      }
    }

    if (opts.ringHint) {
      const y0 = (h * 0.5) | 0;
      for (let x = 0; x < w; x++) {
        for (let t = -2; t <= 2; t++) {
          const y = y0 + t;
          if (y < 0 || y >= h) continue;
          const pi = (y * w + x) * 4;
          d[pi] = Math.min(255, d[pi] + 40);
          d[pi + 1] = Math.min(255, d[pi + 1] + 45);
          d[pi + 2] = Math.min(255, d[pi + 2] + 55);
        }
      }
    }

    ctx.putImageData(img, 0, 0);

    // Normal map from height
    const nc = document.createElement("canvas");
    nc.width = w;
    nc.height = h;
    const nctx = nc.getContext("2d");
    const nimg = nctx.createImageData(w, h);
    const nd = nimg.data;
    const strength = opts.normalStrength != null ? opts.normalStrength : 2.8;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const xl = height[y * w + ((x - 1 + w) % w)];
        const xr = height[y * w + ((x + 1) % w)];
        const yt = height[((y - 1 + h) % h) * w + x];
        const yb = height[((y + 1) % h) * w + x];
        let nx = (xl - xr) * strength;
        let ny = (yt - yb) * strength;
        let nz = 1;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        nx /= len; ny /= len; nz /= len;
        const i = (y * w + x) * 4;
        nd[i] = ((nx * 0.5 + 0.5) * 255) | 0;
        nd[i + 1] = ((ny * 0.5 + 0.5) * 255) | 0;
        nd[i + 2] = ((nz * 0.5 + 0.5) * 255) | 0;
        nd[i + 3] = 255;
      }
    }
    nctx.putImageData(nimg, 0, 0);

    return { color: c, normal: nc, height: height };
  }

  function toTex(THREE, canvasEl, name, isNormal) {
    const tex = new THREE.CanvasTexture(canvasEl);
    if (!isNormal) {
      tex.colorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
    }
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = 12;
    tex.needsUpdate = true;
    tex.name = name || "proc";
    return tex;
  }

  let bakeQueue = null;
  function bakeEnv() {
    const low =
      (typeof navigator !== "undefined" &&
        ((navigator.deviceMemory && navigator.deviceMemory <= 4) ||
          (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4))) ||
      (typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
    const HI = low ? 768 : (window.VesperSky && window.VesperSky.getQualityTier && window.VesperSky.getQualityTier() === "ultra" ? 4096 : 2048); // 8K-class ultra; mobile 768
    const MID = low ? 512 : 1536;
    return { low: low, HI: HI, MID: MID };
  }
  function paintJob(THREE, key, opts, out) {
    const env = bakeEnv();
    const o = Object.assign({}, opts);
    const base = o.size != null ? o.size : 1024;
    // Cap desktop bakes at 1024. 2048–3072 fbm canvases blocked the main
    // thread for minutes (grey worlds, no first frame). Phone stays <=512.
    const hiCap = Math.min(env.HI, 1024);
    o.size = env.low ? Math.min(base, env.MID) : Math.min(hiCap, Math.max(512, Math.min(base, 1024)));
    if (/deimos|phobos|nereid|weywot|namaka|dysnomia/i.test(key)) o.size = env.low ? 384 : 512;
    const painted = paintBody(o);
    out[key] = toTex(THREE, painted.color, key, false);
    out[key + "Normal"] = toTex(THREE, painted.normal, key + "N", true);
  }
  function queueJobs() {
    const jobs = [];
    const mk = (key, opts) => { jobs.push([key, opts]); };

    mk("vesta", {
      seed: 11, size: 1024,
      palette: ["#d2c4a8", "#a89878", "#6e5e48", "#c0b090", "#8a7a60"],
      craters: 160, craterMax: 72,
      feature: { x: 0.52, y: 0.72, rx: 0.28, ry: 0.22, color: "rgba(50,42,34,0.55)" },
      normalStrength: 4.0,
    });
    mk("pallas", { seed: 22, size: 1024, palette: ["#b0a898", "#787060", "#504840", "#989078"], craters: 90, craterMax: 40 });
    mk("ceres", {
      seed: 33, size: 1024,
      palette: ["#9a9aa4", "#6a6a74", "#c4c4cc", "#505058", "#888890"],
      craters: 80, craterMax: 36,
      feature: { x: 0.4, y: 0.45, rx: 0.07, ry: 0.07, color: "rgba(230,240,250,0.65)" },
    });
    mk("deimos", { seed: 44, size: 768, palette: ["#9a8a78", "#6a5a48", "#4a3a30", "#b0a090"], craters: 55, craterMax: 28, normalStrength: 3.5 });
    mk("phobos", {
      seed: 55, size: 768,
      palette: ["#8a7a68", "#5a4a3a", "#a89078", "#3a3028"],
      craters: 70, craterMax: 44,
      feature: { x: 0.45, y: 0.4, rx: 0.18, ry: 0.12, color: "rgba(30,24,20,0.55)" },
      normalStrength: 3.6,
    });
    mk("pluto", {
      seed: 66, size: 1024,
      palette: ["#e8dcc8", "#c8b090", "#f0e8dc", "#6a5a50", "#d0c0a8"],
      craters: 50,
      polarCaps: 0.85,
      feature: { x: 0.55, y: 0.48, rx: 0.22, ry: 0.2, color: "rgba(245,235,225,0.55)" },
    });
    mk("charon", { seed: 77, size: 768, palette: ["#b0b0b8", "#808088", "#606068", "#c8c8d0"], craters: 65,
      feature: { x: 0.5, y: 0.35, rx: 0.2, ry: 0.08, color: "rgba(60,50,70,0.5)" } });
    mk("haumea", { seed: 88, size: 768, palette: ["#f0e8e0", "#d8d0c8", "#fff8f0", "#c8c0b8"], craters: 35, bands: 7 });
    mk("eris", { seed: 99, size: 768, palette: ["#e0e8f0", "#b8c0c8", "#f0f8ff", "#9098a0"], craters: 40 });
    mk("makemake", { seed: 101, size: 768, palette: ["#ecd4b0", "#c8a888", "#f8e8d0", "#a88868"], craters: 36, bands: 5 });
    mk("quaoar", { seed: 112, size: 768, palette: ["#d4b090", "#a88868", "#e8c8a8", "#806848"], craters: 48, ringHint: true });
    mk("hyperion", { seed: 123, size: 768, palette: ["#c8b098", "#8a7060", "#e0d0b8", "#5a4a3a"], craters: 110, craterMax: 22, normalStrength: 4 });
    mk("proteus", { seed: 134, size: 768, palette: ["#a8a8b0", "#6a6a78", "#4a4a58", "#c0c0c8"], craters: 70 });
    mk("nereid", { seed: 145, size: 768, palette: ["#9898a0", "#6a6870", "#b0b0b8", "#c8c8d0"], craters: 55, craterMax: 28, normalStrength: 3.0 });

    const iceKeys = {
      europa: { palette: ["#f7fbff", "#9eb4d8", "#243044", "#ffffff", "#6e84a4"], bands: 11, craters: 36, polarCaps: 0.4, feature: { x: 0.5, y: 0.46, rx: 0.42, ry: 0.03, color: "rgba(18,24,36,0.8)" } },
      enceladus: { palette: ["#f8fcff", "#e0e8f8", "#c8d4f0"], bands: 4, craters: 20, polarCaps: 0.55,
        feature: { x: 0.5, y: 0.78, rx: 0.35, ry: 0.08, color: "rgba(180,200,220,0.4)" } },
      titan: { palette: ["#e0b070", "#b88848", "#f0d090", "#806030", "#c89858"], craters: 25, bands: 5 },
      io: { palette: ["#f0d878", "#d0a040", "#ffe8a0", "#a06020", "#e8c060"], craters: 45, craterMax: 30 },
      ganymede: { palette: ["#c8c0b0", "#a09888", "#e0d8c8", "#706858"], craters: 70 },
      callisto: { palette: ["#7a7568", "#4a4538", "#9a9588", "#2a2820"], craters: 100, craterMax: 48 },
      triton: { palette: ["#d0e0e8", "#a0b0c0", "#e8f4f8", "#8090a0"], craters: 40, bands: 3, polarCaps: 0.7 },
      mimas: { palette: ["#e0e0e0", "#c0c0c0", "#f0f0f0"], craters: 50,
        feature: { x: 0.42, y: 0.4, rx: 0.16, ry: 0.16, color: "rgba(40,40,40,0.55)" } },
      tethys: { palette: ["#e8e8f0", "#c8c8d8", "#f8f8ff"], craters: 45 },
      dione: { palette: ["#e0e0e8", "#b8b8c8", "#f0f0f8"], craters: 50 },
      rhea: { palette: ["#d8d8e0", "#b0b0b8", "#e8e8f0"], craters: 55 },
      iapetus: { palette: ["#e8e0d8", "#3a3028", "#c8c0b8", "#1a1810"], craters: 60 },
      miranda: { palette: ["#d0d0d8", "#a0a0a8", "#e8e8f0"], craters: 40 },
      ariel: { palette: ["#e0e4e8", "#b0b4b8", "#f0f4f8"], craters: 40 },
      umbriel: { palette: ["#606068", "#404048", "#808088"], craters: 50 },
      titania: { palette: ["#c8c8d0", "#909098", "#e0e0e8"], craters: 45 },
      oberon: { palette: ["#a0a0a8", "#707078", "#c0c0c8"], craters: 50 },
    };
    Object.keys(iceKeys).forEach((k, i) => {
      const def = iceKeys[k];
      mk(k, Object.assign({ seed: 200 + i, size: 1024, craterMax: 36, normalStrength: 2.9 }, def));
    });

    // Station metals — warm industrial, not purple
    mk("stationHull", {
      seed: 900, size: 1024,
      palette: ["#8a94a4", "#5a6474", "#b0b8c4", "#3a4454", "#6a7484", "#9aa4b4"],
      craters: 22, craterMax: 12, normalStrength: 2.6, bands: 9,
    });
    mk("stationPanel", {
      seed: 901, size: 1024,
      palette: ["#4a5568", "#2a3548", "#6a7588", "#1a2538", "#708090"],
      craters: 10, craterMax: 8, normalStrength: 2.2, bands: 14,
    });
    mk("stationFloor", {
      seed: 902, size: 1024,
      palette: ["#3a4050", "#2a3038", "#505868", "#1a2028", "#606878"],
      craters: 12, craterMax: 6, normalStrength: 2.0, bands: 18,
    });
    mk("stationRock", {
      seed: 903, size: 1024,
      palette: ["#6a5e52", "#4a4038", "#8a7a68", "#2a2420", "#a09078"],
      craters: 90, craterMax: 48, normalStrength: 3.8,
    });

    return jobs;
  }
  function bake(THREE) {
    if (!THREE) return {};
    const out = {};
    queueJobs().forEach(([k, o]) => paintJob(THREE, k, o, out));
    return out;
  }
  function bakeStep(THREE, maxMs) {
    if (!THREE) return { done: true, left: 0, out: {} };
    if (!bakeQueue) bakeQueue = queueJobs();
    const out = (window.__vesperProcPartial = window.__vesperProcPartial || {});
    const t0 = performance.now();
    const budget = maxMs == null ? 10 : maxMs;
    while (bakeQueue.length && performance.now() - t0 < budget) {
      const job = bakeQueue.shift();
      paintJob(THREE, job[0], job[1], out);
    }
    return { done: bakeQueue.length === 0, left: bakeQueue.length, out: out };
  }

  window.VesperProcTex = { bake, bakeStep, paintBody };
})();
