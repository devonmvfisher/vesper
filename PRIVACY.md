# Vesper privacy

**Short version:** The planetarium runs in your browser. Optional Live AI keys never leave your device except to the URL **you** paste.

## Sky call (☎)

- **Offline companion (default):** no account, no key, no network. Answers use on-page cockpit state (mode, gear, look-at).
- **API keys / base URL / model:** stored only in `localStorage` on this device (`vesper.agentApiKey`, etc.).
- **Live AI (Advanced):** only after you opt in (confirm dialog). Sends chat text + brief sky context (mode, gear, look-at) to **your** OpenAI-compatible endpoint. URL must be `https://` or `http://localhost` / `127.0.0.1`.
- Keys are **not** logged to the console, not embedded in toasts/guide narration, and Live errors do not paste provider response bodies into chat.
- **Clear keys** lives under Advanced. Clearing removes key + related Live settings from this browser.
- Chat UI renders user/model text with `textContent` (no raw HTML injection).

## Other local data

- Flight prefs (mode, gear, clock, Straight Man), cinema flag, voxels (`vesper.voxels.v1`) — device-local only.
- Service worker caches shell + textures from **this origin** only; never caches `Authorization` requests or cross-origin API calls.

## Observation Station / radio

- Walkman equip flag + mute/track prefs in `localStorage` (`vesper.radioEquipped`, etc.).
- Procedural Web Audio on-device only. No streams, accounts, or ripped tracks. Original meshes — no third-party franchise assets.

## Not collected

Vesper does not include analytics SDKs or phone home. If you use Live AI, your provider’s own privacy policy applies to what you send them.
