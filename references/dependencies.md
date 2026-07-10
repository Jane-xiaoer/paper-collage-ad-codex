# Dependencies

Run `bash <SKILL_DIR>/scripts/check-deps.sh` to verify everything below at once.

## Core (required for every render)

Used by `render.mjs`, `layer-animate.mjs` and `assemble.mjs`.

| Tool | Purpose | Install (macOS) |
| --- | --- | --- |
| `ffmpeg` | encode video and audio, all filtergraphs | `brew install ffmpeg` |
| `ffprobe` | stream-level duration and frame-count validation | ships with ffmpeg |
| `node` (>= 18) | run the `.mjs` renderers | `brew install node` or nvm |
| `bash` | run the shell helpers | preinstalled on macOS |

If any core tool is missing, no pipeline script will work. Nothing else is required to render stills, layered animation, or a scene assembly.

## Reference-voice cloning (optional)

Only needed when the user supplies an authorized reference voice and wants local cloning. Used by `extract-reference-voice.sh` and the IndexTTS-2 path in `audio-production.md`.

| Tool | Purpose | Install |
| --- | --- | --- |
| `uv` / `uvx` | run demucs and IndexTTS-2 in isolated envs | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| `demucs` | separate vocals from a merged soundtrack | pulled on demand via `uvx --from demucs` |
| `hf` | download the MLX IndexTTS-2 model | `pip install huggingface_hub[cli]` |
| `mlx-indextts` | local Apple-Silicon voice cloning | run `scripts/setup-indextts2-mlx.sh` (see `audio-production.md`) |

The wrapper installs third-party code and model weights under `~/.local/share/paper-collage-ad/`. It never adds a reference voice or speaker `.npz` to this skill. Store user-provided voice material only under `<project>/assets/voice-reference/` and `<project>/assets/voice-model/`.

## TTS fallback

| Tool | Purpose | Notes |
| --- | --- | --- |
| `say` | deterministic local Chinese narration | macOS only; use `-v Tingting`. Convert output to 48 kHz WAV. |

On non-macOS hosts, supply your own TTS and drop the resulting WAVs into `assets/voice-final/`; the rest of the pipeline is unchanged.

## Optional generation tools

Image keyframes and music are produced by whatever generator the host agent has (nano-banana-2 / Nano Banana Pro, a music model, etc.). These are not shell dependencies of this skill; the scripts only consume the finished assets you place in the project directory.
