# Local Layer Animation

Use this method when no image-to-video model is available and the source is a flattened paper-collage keyframe.

## Layer plan

1. Identify the blank paper field, title, logo, large environment pieces and independently moving subjects.
2. Crop each subject with enough padding to preserve its original shadow.
3. Apply a 20 to 30 pixel feathered alpha edge to hide crop boundaries.
4. Rebuild the empty field from the sampled dominant paper color plus very low Gaussian noise.
5. Keep the untouched finished frame as the final lock layer.

Group related objects when precise segmentation is not available. Examples include a character plus its doorway, a complete workstation, or a window plus its connected ribbon. Avoid tiny fragments that create visible seams.

## Motion

Animate crops with FFmpeg `overlay` expressions. Quantize movement into 6 to 10 steps with `floor(progress * steps) / steps` to create stop-motion cadence.

Use different entrances for adjacent groups:

- Slide a base or stage upward first.
- Bring characters from alternating edges.
- Drop workstations from above in story order.
- Scale or compress a cloud for a deflation joke.
- Converge format chips toward the center before the logo arrives.

Reveal the title after the main action. Fade the untouched full frame in during the final 0.4 to 0.6 seconds. Hold the full frame for at least one second when time permits.

## Artifact control

- Sample the actual background mean color instead of guessing the paper hex.
- Use a generated noise field rather than tiling a crop, because repeated tiles create visible seams.
- Increase feathering when rectangular crop boundaries remain visible.
- Do not crop through neighboring black objects. Partial neighboring edges produce small black marks during assembly.
- Prefer one larger crop over several overlapping crops when the objects are tightly connected.
- Inspect both an early assembly frame and the final lock frame for every scene.

## Final assembly

Render every scene to the same resolution, FPS, codec and pixel format. Concatenate scenes on hard cuts or short paper wipes, then attach the single final audio mix. Verify video and audio duration at stream level and confirm the expected frame count.
