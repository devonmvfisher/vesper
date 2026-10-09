# Notice

Vesper is a browser planetarium and space toy. This file says what the MIT licence in `LICENSE` covers, what it does not cover, and where the parts that are not original to Vesper come from.

## What the MIT licence covers

The MIT licence in the `LICENSE` file (`Copyright (c) 2026 Devon Fisher`) covers the code of Vesper: `index.html`, `sw.js`, `manifest.webmanifest`, `css/`, and the files in `js/`.

It also covers the short interface text inside that code: button labels, menu words and short status lines.

It does not cover the third-party pieces listed below, which keep their own licences.

## What it does not cover

The MIT licence does not cover:

- Films, art and pictures. In this repository that means the planet and star textures and the three app icons, each described below.
- Written pages and page copy: `PRIVACY.md`, and the help text and other written paragraphs in `index.html`.
- Story, lore and companion lines inside the code files. For example: the companion lines in `js/vesper-companion-brain.js`, the character, quest and mission text in `js/vesper-life.js` and `js/vesper-places.js`, the tour names in `js/vesper-tours.js`, the body notes in `js/vesper-body-notes.js`, and the hints and tips in `js/vesper-hope.js`. The MIT licence covers the code around those words, not the words.

Any text longer than a short label or status line counts as written text, so it is not under the MIT licence. Devon Fisher keeps all rights in the written pages and in the story, lore and companion lines.

Vesper includes no audio files. Its sound is generated in the browser by code.

## Third-party pieces

### three.js r160

File: `vendor/three.min.js`. Licence: MIT. The notice in the file header is kept as it is:

    @license
    Copyright 2010-2023 Three.js Authors
    SPDX-License-Identifier: MIT

The full MIT licence text for three.js is in `vendor/LICENSE-three.txt`. It is a copy of the LICENSE file in the three.js 0.185.0 package, which shows the years 2010 to 2026. Its permission text is the same MIT text as in the `LICENSE` file of this repository, with three.js's own copyright line.

Not yet confirmed: a licence file from the three.js r160 release itself, so the years in the copy (2010 to 2026) are later than the years in the file header (2010 to 2023).

### Solar System Scope textures

Folder: `assets/textures/` (13 files: `2k_sun`, `2k_mercury`, `2k_venus_atmosphere`, `2k_earth_daymap`, `2k_earth_clouds`, `2k_moon`, `2k_mars`, `2k_jupiter`, `2k_saturn`, `2k_saturn_ring_alpha`, `2k_uranus`, `2k_neptune`, `2k_stars_milky_way`).

Licence: CC BY 4.0, https://creativecommons.org/licenses/by/4.0/. These files are not under the MIT licence. Source: https://www.solarsystemscope.com/textures/ , mirrored via the Wikimedia Commons category "Solar System Scope". Based on NASA elevation and imagery data. Colours enhanced; gaps may use fictional fill. Credit: Solar System Scope. This does not imply NASA endorsement.

The original attribution file is kept unchanged at `assets/textures/ATTRIBUTION.txt`.

### Planetary data

Orbit, size and gravity figures are approximate values from public NASA and JPL planetary fact sheets and IAU definitions, as noted in `js/main.js` and `js/vesper-science.js`. No NASA files are included. This project is not endorsed by NASA.

## App icons

- `assets/icon-192.png` (192 by 192 pixels)
- `assets/icon-512.png` (512 by 512 pixels)
- `assets/apple-touch-icon.png` (180 by 180 pixels)

Each is a plain round gradient: a gold centre, a blue-grey disc, a violet glow and a dark ground. The 192 and 180 pixel files look like the 512 file made smaller. They hold only the basic picture data, with no embedded metadata. These three pictures are not covered by the MIT licence.

Not yet confirmed: where these three pictures came from.
