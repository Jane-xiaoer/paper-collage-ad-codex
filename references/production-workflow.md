# Production Workflow and Artifact Layout

## Table of contents

1. Project layout
2. Stage gates
3. Duration strategy
4. Animation routes
5. Render and handoff

## 1. Project layout

Preserve intermediate artifacts so the ad can be revised without restarting:

```text
project/
  brief.md
  script.md
  storyboard.json
  manifests/
    prompts.json
    production-manifest.json
  assets/
    brand/
    screenshots/
    keyframes/
    layers/
    voice-reference/
    voice-model/
    voice-raw/
    voice-final/
    audio/
  renders/
    scene-01.mp4
    scene-02.mp4
    contact-sheet.jpg
    final.mp4
  scripts/
```

Never scatter generated assets across Downloads or temporary folders. Copy project-bound outputs into this structure immediately.

## 2. Stage gates

Do not advance until each gate is acceptable:

1. **Brief gate:** product promise, required facts, audience, CTA and format are explicit.
2. **Story gate:** one recurring visual metaphor, one fact and one joke per scene.
3. **Style gate:** first finished keyframe locks paper field, halftone, cuts, shadows, palette and character proportions.
4. **Continuity gate:** all keyframes pass a contact-sheet review.
5. **Motion gate:** early assembly, main action and final lock frame are free of seams and morphing.
6. **Voice gate:** every line is intelligible, correctly pronounced and measured.
7. **Picture-lock gate:** scene durations are derived from selected voice takes.
8. **Master gate:** H.264 and AAC streams cover the exact duration and the contact sheet is clean.

## 3. Duration strategy

Use 30 seconds only as a starting constraint, not a universal target. Five scenes often need 40 to 60 seconds when the copy contains jokes, feature proof and a privacy beat.

Allocate runtime after voice generation. Keep the first tension or joke inside five seconds, but allow later scenes to breathe. A useful five-scene range is:

- Pain joke: 7 to 11 seconds.
- Product entrance: 7 to 10 seconds.
- Capability proof: 8 to 12 seconds.
- Trust or privacy beat: 8 to 11 seconds.
- Resolution and CTA: 7 to 10 seconds.

When extending an existing cut, slow each scene independently. Use `setpts` based on source and target duration, then force the final FPS. Do not globally slow the final MP4 if narration and sound effects need different timing.

## 4. Animation routes

Choose one route and keep motion language consistent:

- **Image-to-video:** use when a reliable model can preserve the supplied finished frame and paper materials.
- **Layered local animation:** use for deterministic cutout entrances, stop-motion cadence and final-frame lock. Read `local-layer-animation.md`.
- **Finished-frame fallback:** use `scripts/render.mjs` when only still keyframes are available.
- **Scene-video assembly:** use `scripts/assemble.mjs` when each scene already exists as an MP4 and needs retiming, narration, music and sound effects.

For every route, reveal the finished frame long enough to read. Avoid perpetual breathing, random drift, morphing paper shapes and rapid template transitions.

## 5. Render and handoff

Create a manifest based on `examples/production-manifest.json`, then run:

```bash
node <SKILL_DIR>/scripts/assemble.mjs \
  --manifest manifests/production-manifest.json \
  --output renders/final.mp4
```

Deliver:

- Final MP4.
- Contact sheet with one middle frame per scene.
- Script and storyboard.
- Production manifest.
- Selected narration files and final audio mix.
- Prompt manifest and approved keyframes.

Retain raw voice takes, reference audio and precomputed speaker files privately inside the project. Do not publish or commit the reference voice or speaker `.npz` as a marketing deliverable.
