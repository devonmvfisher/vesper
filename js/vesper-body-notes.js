/**
 * Vesper body-note cards — neat lore on focus/approach; never HUD spam.
 * Hidden in cinema / hide-controls. Auto-dismiss.
 */
(function () {
  "use strict";
  const HOLD_MS = 8500;
  const COOLDOWN_MS = 16000;
  let el = null;
  let titleEl = null;
  let textEl = null;
  let hideTimer = 0;
  let lastName = "";
  let lastShownAt = 0;
  const seen = Object.create(null);

  function ensure() {
    if (el) return;
    el = document.createElement("aside");
    el.id = "body-note";
    el.setAttribute("aria-live", "polite");
    el.hidden = true;
    el.innerHTML =
      '<div class="body-note-inner">' +
      '<button type="button" class="body-note-close" aria-label="Dismiss">✕</button>' +
      '<p class="body-note-kicker">Science almanac</p>' +
      "<strong id=\"body-note-title\"></strong>" +
      '<p id="body-note-text"></p>' +
      "</div>";
    document.body.appendChild(el);
    titleEl = el.querySelector("#body-note-title");
    textEl = el.querySelector("#body-note-text");
    el.querySelector(".body-note-close").addEventListener("click", hide);
  }

  function blocked() {
    return (
      document.body.classList.contains("hide-controls") ||
      document.body.classList.contains("cinema-mode") ||
      document.body.classList.contains("sky-call-open")
    );
  }

  function hide() {
    if (!el) return;
    el.hidden = true;
    el.classList.remove("show");
    document.body.classList.remove("almanac-open");
    clearTimeout(hideTimer);
  }

  function scienceLine(name) {
    try {
      if (window.VesperScience && window.VesperScience.fact) {
        const f = window.VesperScience.fact(name);
        if (f) return f;
      }
    } catch (_) {}
    return "";
  }

  function skyPulledIn(name) {
    try {
      const sci = window.VesperScience;
      const al = sci && sci.ALMANAC && sci.ALMANAC[name];
      if (!al || typeof al.a_au !== "number" || !(al.a_au > 0)) return "none";
      const sky = window.VesperSky;
      const bodies = sky && sky._bodiesRef && sky._bodiesRef();
      if (!bodies || !window.THREE) return "none";
      const b = bodies.find((x) => x && x.name === name && x.mesh);
      const sun = bodies.find((x) => x && x.name === "Sun" && x.mesh);
      const au = (sky.getScale && sky.getScale().auUnit) || 16000;
      if (!b || !sun || !(au > 0)) return "none";
      if (!skyPulledIn._a) {
        skyPulledIn._a = new window.THREE.Vector3();
        skyPulledIn._b = new window.THREE.Vector3();
      }
      b.mesh.getWorldPosition(skyPulledIn._a);
      sun.mesh.getWorldPosition(skyPulledIn._b);
      const r = skyPulledIn._a.distanceTo(skyPulledIn._b) / au;
      if (Math.abs(r - al.a_au) / al.a_au > 0.12) return "far";
      return "match";
    } catch (_) {
      return "none";
    }
  }

  function show(name, blurb) {
    ensure();
    if (blocked()) return;
    const sci = scienceLine(name);
    const text = sci || blurb;
    if (!name || !text) return;
    blurb = text;
    const now = performance.now();
    // First focus in a while, or new body — avoid spam
    if (name === lastName && now - lastShownAt < COOLDOWN_MS) return;
    if (seen[name] && now - seen[name] < COOLDOWN_MS * 2.5) return;
    lastName = name;
    lastShownAt = now;
    seen[name] = now;
    // Name only. A science note that says "display fiction" (Jupiter, Saturn)
    // or a real moon named Hyperion must not become a Hyp plaque.
    const hypNames =
      (window.VesperHypothetics &&
        window.VesperHypothetics.names &&
        window.VesperHypothetics.names()) ||
      [];
    let hyp = hypNames.indexOf(name) >= 0 || /\(Hyp\)/.test(name);
    if (!hyp && window.VesperSky && window.VesperSky._bodiesRef) {
      const hit = window.VesperSky._bodiesRef().find((b) => b && b.name === name);
      hyp = !!(hit && hit.hypothetic);
    }
    titleEl.textContent = hyp ? name + " · Hyp (fiction)" : name;
    // The old suffix told every real body "orbit ratios ≈ AU".
    // Sedna's dot is near 18 AU. The Moon orbits Earth. The ISS is not that circle.
    let honesty = " Radii are display-boosted for phone skim.";
    let kickText = "Science note";
    if (hyp) {
      honesty = " Labeled fiction — not measured Sol.";
      kickText = "Hyp · fiction plaque";
    } else {
      const pulled = skyPulledIn(name);
      if (pulled === "far") {
        honesty = " Almanac a is real. This dot sits closer than that orbit. Radii are display-boosted.";
        kickText = "Almanac a · sky pulled in";
      } else if (pulled === "match") {
        honesty = " Orbit ratio matches the almanac a. Radii are display-boosted for phone skim.";
        kickText = "Science almanac · orbit ratio";
      }
    }
    textEl.textContent = blurb + honesty;
    const kick = el.querySelector(".body-note-kicker");
    if (kick) kick.textContent = kickText;
    el.hidden = false;
    document.body.classList.add("almanac-open");
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, HOLD_MS);
  }

  window.addEventListener("vesper:lookat", (ev) => {
    const d = ev.detail || {};
    const fallback = d.blurb || (window.VesperSky && window.VesperSky.getBlurb && window.VesperSky.getBlurb(d.name));
    show(d.name, scienceLine(d.name) || fallback);
  });
  let travelToken = 0;
  window.addEventListener("vesper:travel", (ev) => {
    const d = ev.detail || {};
    const token = ++travelToken;
    // A jump that already left this body must not open its card later.
    // Home has no body card. Hide the one from the world you just left.
    if (!d.name || d.name === "Home") {
      hide();
      return;
    }
    const bl =
      (window.VesperSky && window.VesperSky.getBlurb && window.VesperSky.getBlurb(d.name)) || "";
    hide();
    setTimeout(() => {
      if (token !== travelToken) return;
      show(d.name, bl);
    }, 700);
  });
  window.addEventListener("vesper:hideControls", (ev) => {
    if (ev.detail && ev.detail.on) hide();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hide();
  });

  window.VesperBodyNotes = { show, hide };
})();
