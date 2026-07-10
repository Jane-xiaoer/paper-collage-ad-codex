# Fallbacks and Quality Control

## Image generation

- Save every project-bound image inside the project immediately after generation.
- Reuse the first approved frame in every later call.
- Inspect a contact sheet before animation. Reject visible style drift, malformed titles and incorrect brand marks.

## Chinese TTS

Symptoms of a wrong voice include a 4-second line taking 14 to 20 seconds, missing lines, and zero word timings.

Validate every output with `ffprobe`. On macOS, a deterministic fallback is:

```bash
say -v Tingting -r 205 -o line.aiff '旁白内容'
ffmpeg -y -i line.aiff -ar 48000 -ac 1 line.wav
```

Keep one voice and one rate across the film.

## FFmpeg still animation

For a scene with nominal duration `D`, transition duration `T` and frame rate `F`, generate `ceil((D + T) * F)` frames for every scene except the final one. Generate `ceil(D * F)` frames for the final scene. Chain transitions at cumulative nominal scene durations.

Always reset each scene with `setpts=PTS-STARTPTS` before `xfade`.

## Validation

Use stream-level duration, not only container duration:

```bash
ffprobe -v error \
  -show_entries stream=index,codec_name,duration,nb_frames,width,height,r_frame_rate \
  -of json output.mp4
```

Both audio and video must cover the expected duration. Frame count must be approximately `duration * fps`.

Extract middle frames for review with PNG output to avoid JPEG range issues:

```bash
ffmpeg -y -ss 8 -i output.mp4 -frames:v 1 -vf format=rgb24 review-08.png
```
