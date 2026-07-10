#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: extract-reference-voice.sh INPUT_VIDEO OUTPUT_DIR" >&2
  exit 2
fi

INPUT="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
OUT="$2"
STEM="$(basename "${INPUT%.*}")"

mkdir -p "$OUT/source" "$OUT/separated"
ffmpeg -y -loglevel error -i "$INPUT" -vn -ar 44100 -ac 2 "$OUT/source/$STEM.wav"

uvx --from demucs --with torchcodec demucs \
  --two-stems=vocals -n htdemucs \
  --out "$OUT/separated" "$OUT/source/$STEM.wav"

VOCALS="$OUT/separated/htdemucs/$STEM/vocals.wav"
echo "vocals: $VOCALS"
echo "candidate speech regions:"
ffmpeg -hide_banner -i "$VOCALS" \
  -af silencedetect=noise=-38dB:d=0.25 -f null - 2>&1 \
  | grep -E 'silence_(start|end)' || true
