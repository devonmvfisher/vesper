/**
 * Student field notebook — local export of soft-land milestones + look facts.
 */
(function () {
  "use strict";
  function snapshot() {
    const miles = (window.VesperMilestones && window.VesperMilestones.seen && window.VesperMilestones.seen()) || {};
    const ver = (window.VesperSky && window.VesperSky.version && window.VesperSky.version()) || "?";
    const look = window.VesperSky && window.VesperSky.getLookingAt && window.VesperSky.getLookingAt();
    const fact = window.VesperScience && look ? window.VesperScience.fact(look) : "";
    const walk = window.VesperSky && window.VesperSky.getWalkBody && window.VesperSky.getWalkBody();
    const bio = window.VesperSurfaces && window.VesperSurfaces.active && window.VesperSurfaces.active();
    const alm = window.VesperScience && window.VesperScience.ALMANAC ? Object.keys(window.VesperScience.ALMANAC).length : 0;
    const hopeN = window.VesperHope && window.VesperHope.tips ? window.VesperHope.tips.length : 0;
    return {
      version: ver,
      exportedAt: new Date().toISOString(),
      milestones: miles,
      focus: look || null,
      focusFact: fact || null,
      walking: walk || null,
      walkBiome: (bio && bio.biome) || null,
      almanacBodies: alm,
      hopeTips: hopeN,
      note: "Vesper field notebook — educational, Sol-honest where labeled. Expanse/dreamer care optional.",
    };
  }
  function download() {
    const data = JSON.stringify(snapshot(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vesper-field-notebook.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function boot() {
    // Hotkey N when not typing
    window.addEventListener("keydown", (e) => {
      if (e.key === "n" || e.key === "N") {
        const t = e.target;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
        if (e.altKey || e.metaKey || e.ctrlKey) return;
        download();
        const el = document.getElementById("guide-toast");
        if (el) {
          el.hidden = false;
          el.textContent = "Field notebook exported (JSON)";
          el.classList.add("show");
          clearTimeout(download._toast);
          download._toast = setTimeout(() => {
            if (el.textContent === "Field notebook exported (JSON)") el.classList.remove("show");
          }, 2200);
        }
      }
    });
  }
  window.VesperNotebook = { snapshot: snapshot, download: download };
  window.addEventListener("vesper:ready", boot);
})();
