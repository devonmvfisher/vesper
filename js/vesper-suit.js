/**
 * Vesper flight suit chrome — helmet vignette + thin collar only.
 * No large translucent arm blobs (they fought the stick/thrusters).
 * Original design; not ME/Halo IP.
 */
(function () {
  "use strict";
  const LS = "vesper.suitChrome";
  let root = null;

  function ensure() {
    if (root) return root;
    root = document.createElement("div");
    root.id = "suit-chrome";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = [
      '<div class="suit-vignette"></div>',
      '<div class="suit-helmet-rim"></div>',
      '<div class="suit-collar"></div>',
      '<div class="suit-hud-pip" id="suit-pip">VESPER · HOPE</div>',
    ].join("");
    document.body.appendChild(root);
    return root;
  }

  function sync() {
    ensure();
    const walk = document.body.dataset.walk === "1";
    const pilot = document.body.dataset.flightMode === "pilot";
    const hide = document.body.classList.contains("hide-controls");
    const cinema = document.body.classList.contains("cinema-mode");
    let on = true;
    try {
      if (localStorage.getItem(LS) === "0") on = false;
    } catch (_) {}
    // Subtle always; a touch stronger on walk/pilot — never opaque blobs over controls
    const show = on && !hide && !cinema;
    root.classList.toggle("show", show);
    root.classList.toggle("intense", !!(walk || pilot));
    root.classList.toggle("walk", walk);
    const pip = document.getElementById("suit-pip");
    if (pip) {
      const sky = window.VesperSky; const wb = sky && sky.getWalkBody && sky.getWalkBody();
      // Exact names. A substring test marked Counter-Earth as Earth and Titania as Titan.
      const hopeBodies = {
        Earth: 1, Mars: 1, Europa: 1, Titan: 1, "Observation Station": 1,
        "Starman Roadster": 1, Enceladus: 1, Iapetus: 1, Miranda: 1, Mimas: 1,
        Charon: 1, Vesta: 1, Sedna: 1
      };
      let hypBody = false;
      if (walk && wb && sky._bodiesRef) {
        const hit = sky._bodiesRef().find((b) => b && b.name === wb);
        hypBody = !!(hit && hit.hypothetic);
      }
      const hopeWalk = walk && wb && !hypBody && !!hopeBodies[wb];
      let gear = "";
      try {
        if (window.VesperLife && window.VesperLife.hasItem) {
          const bits = [];
          if (window.VesperLife.hasItem("weapon-flare")) bits.push("FLARE");
          if (window.VesperLife.hasItem("weapon-scanner")) bits.push("SCAN");
          if (window.VesperLife.hasItem("weapon-hail-beacon") || window.VesperLife.hasItem("weapon-signal-lamp")) bits.push("HAIL");
          if (window.VesperLife.hasItem("weapon-foam-sprayer") || window.VesperLife.hasItem("weapon-patch-gun")) bits.push("SEAL");
          if (window.VesperLife.hasItem("rover-key")) bits.push("ROVER");
          if (window.VesperLife.hasItem("hope-beacon-kit")) bits.push("BEACON");
          if (bits.length) gear = " · " + bits.slice(0, 2).join("+");
        }
      } catch (_) {}
      pip.textContent = hypBody
        ? "SUIT · FICTION" + gear
        : hopeWalk
        ? "SUIT · HOPE · " + wb + gear
        : walk
          ? "SUIT · SURFACE" + gear
          : pilot
            ? "SUIT · PILOT" + gear
            : "VESPER · HOPE";
      pip.style.opacity = walk || pilot ? "0.65" : "0.32";
    }
  }

  function boot() {
    ensure();
    sync();
    setInterval(sync, 500);
    try {
      new MutationObserver(sync).observe(document.body, {
        attributes: true,
        attributeFilter: ["class", "data-walk", "data-flight-mode"],
      });
    } catch (_) {}
  }

  window.addEventListener("vesper:ready", boot);
  window.addEventListener("vesper:hideControls", sync);
  if (document.readyState !== "loading") boot();
  else window.addEventListener("DOMContentLoaded", boot);

  window.VesperSuit = {
    setEnabled(on) {
      try {
        localStorage.setItem(LS, on ? "1" : "0");
      } catch (_) {}
      sync();
    },
  };
})();
