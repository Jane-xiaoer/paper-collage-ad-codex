# Narration and Sound Production

## Timing rule

Do not lock the final runtime before producing a representative narration take. Draft the copy, generate one voice file per scene, measure each file, then set scene duration to:

`voice duration + 0.7 to 1.5 seconds`

Leave room before the first word, after the punchline and for the final visual hold. If the cut feels rushed, extend the picture first. Rewrite the line second. Use pitch-preserving time compression only as a last adjustment and keep it at or below about 1.12x.

## Comic delivery

Write one spoken joke per scene. Use concrete comic images instead of generic enthusiasm:

- Escalation: "一个文件，一个应用。再来一个文件，再来一个应用。"
- Literal metaphor: turn application overload into a traffic jam or factory queue.
- Dry refusal: "云端想帮忙？谢谢，不用。"
- Contrast: "以前要组个软件团，现在一个就开工。"
- Button line: end with a short confident tag after the product promise.

Deliver the joke more calmly than the picture. Preserve a short pause before the reversal. Avoid shouting, exaggerated sales rhythm and constant high emotion.

## Reference-voice extraction

Use only audio the user owns or is authorized to use. Disclose that the delivered narration is AI-generated.

Extract and separate a merged reference track with:

```bash
bash <SKILL_DIR>/scripts/extract-reference-voice.sh input.mp4 assets/voice-reference
```

Choose a clean 6 to 12 second speech region with no overlapping speakers. Prepare it as mono WAV:

```bash
ffmpeg -y -ss START -to END -i vocals.wav \
  -af "highpass=f=75,lowpass=f=14000,afftdn=nf=-28,loudnorm=I=-20:TP=-2:LRA=7" \
  -ar 22050 -ac 1 narrator-reference.wav
```

Do not feed a full soundtrack into voice cloning. Background music and reverb leak into the synthesized voice.

## Local IndexTTS-2 on Apple Silicon

Use the Apple Silicon MLX path when the user wants local generation and reference-voice cloning. The selected TTS is the MIT-licensed `solar2ain/mlx-indextts` runtime with an IndexTTS-2 MLX model. Treat the runtime and model as third-party dependencies; do not vendor them or any user voice into this skill.

Install the runtime and model outside the skill repository:

```bash
bash <SKILL_DIR>/scripts/setup-indextts2-mlx.sh
```

The default local runtime path is:

```text
~/.local/share/paper-collage-ad/mlx-indextts/
  models/mlx-indextts2-standard-fp16/
```

Keep voice inputs and outputs inside the user's advertisement project, never inside the skill:

```text
<project>/assets/voice-reference/reference.wav
<project>/assets/voice-model/speaker-v2.npz
<project>/assets/voice-final/01.wav
```

Require the user to supply a clean, authorized 6 to 12 second recording. Precompute the private speaker file once:

```bash
bash <SKILL_DIR>/scripts/prepare-indextts2-voice.sh \
  <project>/assets/voice-reference/reference.wav \
  <project>/assets/voice-model/speaker-v2.npz \
  --i-have-permission
```

Copy `examples/voice-manifest.indextts2.json` into `<project>/manifests/`, edit the lines and generate one 48 kHz WAV per scene:

```bash
node <SKILL_DIR>/scripts/narrate-indextts2.mjs \
  --manifest <project>/manifests/voice.indextts2.json
```

Use fixed seeds. Use a calm base plus modest happy or surprised emotion. Keep `emoAlpha` near 0.45 to 0.65, `diffusionSteps` around 16 to 25 and speed around 1.00 to 1.06. Higher emotion values often reduce naturalness. Keep raw and selected takes separate. Do not overwrite the source take when fitting timing.

Only clone a voice the user owns or has explicit permission to use. Keep the recording and `.npz` private, exclude them from Git, and disclose AI-generated narration in the final delivery.

## Mix targets

- Convert selected narration to 48 kHz WAV.
- Keep narration primary; start music near 0.08 to 0.12 linear volume.
- Place paper clicks, pops, whooshes and chimes on meaningful actions only.
- Target approximately -16 LUFS integrated and no higher than -1.5 dB true peak.
- Check the rendered file with `volumedetect`; reject clipping and inaudible narration.
