# HyperFrames route — key-free, deterministic animation for paper-cut ads

HyperFrames (heygen-com/hyperframes, Apache 2.0) renders **HTML + GSAP** compositions to MP4 **locally** — node 22+ + headless Chrome + ffmpeg, **no API key, no per-render fee, no limits**. It is the second animation route for this skill and the *best* option for precise, controllable scenes.

## When to use it
- **No video-model key** (no Seedance/volc) → do the whole film here.
- **Precise scenes even when you have a model** → logo motion, UI reveals, paper-element choreography, on-beat text. Video models morph logos and mis-time reveals; HyperFrames is frame-exact.
- Keep **organic/physical scenes** (files raining, natural motion + native foley) on an AI model; hybrid is ideal.

## The one rule: animate real paper, don't fake it in CSS
A pure CSS/gradient look is the "flat vector pretending to be paper" trap (see `collage-dimensions.md`). Instead:
1. Generate the paper assets with the image model (nano): a **paper texture background** (empty warm paper field) and **paper-cut element PNGs** (the cut-out shapes, ideally with their own halftone + soft shadow).
2. Put them in `<project>/assets/` and choreograph *those* with GSAP.
Texture comes from the real paper assets; precision comes from GSAP.

## The precise-logo trick (shutter rotates, ear stays locked)
Two stacked copies of the paper-cut icon, concentric:
```css
#shutter,#center{position:absolute;inset:0;background:url(assets/brand-icon-paper.jpg) center/contain no-repeat;}
#shutter{clip-path:circle(49% at 50% 50%);}   /* outer ring — GSAP rotates this */
#center{clip-path:circle(21% at 50% 50%);}     /* center — static, locks the mark */
```
```js
gsap.set("#shutter",{transformOrigin:"50% 50%"});
tl.to("#shutter",{rotation:40,ease:"none",duration:5},0);
```
The rotating copy shows the blades turning; the static center copy covers the rotating middle, so the central brand mark never moves or morphs. **Bonus:** all text (wordmark, URL) is real HTML → never mis-spells (unlike AI-rendered text); multi-colour URLs are trivial with `<span>`.

## Composition contract (what the renderer needs)
- Root: `<div id="main-composition" data-composition-id="main" data-width="1920" data-height="1080" data-duration="5">`.
- GSAP timeline created `paused:true` and registered: `window.__timelines["main"] = tl;`
- Don't mix a CSS `transform: translateX(-50%)` centering with a GSAP `y` tween on the same element (GSAP overwrites the whole transform) — center with `left/margin` instead.
- Fonts: headless Chrome only has system fonts + `@font-face`/Google-Fonts you import. Snell Roundhand isn't auto-resolvable — embed it via `@font-face` or drop in the real wordmark PNG for final delivery.

## Commands (from the project dir)
```bash
npx hyperframes@latest init <name> --example warm-grain --non-interactive --resolution landscape
# author index.html, put assets in ./assets
npx hyperframes snapshot . --at 1.0,2.5,4.5 -o snaps   # verify frames (StaticGuard flags contract issues)
npx hyperframes render . -o scene.mp4                    # render to MP4 (~20-45s for 5s @1080p)
```
`snapshot` + StaticGuard + `compare` are strong verification tools — use them instead of guessing.

## Install

Use the Apache-2.0 HyperFrames CLI through `npx hyperframes@latest`. Install Node 22+, Chrome and FFmpeg locally. Keep any framework-specific development hooks out of the user's global Codex configuration.

Starter: `examples/hyperframes-logo-composition.html` (generic CTA logo scene: paper-cut icon two-layer rotation + real-HTML two-colour URL + GSAP text bounce).
