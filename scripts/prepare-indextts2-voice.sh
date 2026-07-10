#!/usr/bin/env bash

# Normalize one authorized reference recording and precompute an IndexTTS-2
# speaker-conditioning file. The reference and .npz remain in the user's project.

set -euo pipefail

RUNTIME_DIR="${PAPER_COLLAGE_TTS_HOME:-${HOME}/.local/share/paper-collage-ad/mlx-indextts}"
MODEL_DIR="${INDEXTTS_MODEL_DIR:-${RUNTIME_DIR}/models/mlx-indextts2-standard-fp16}"
MEMORY_LIMIT="${INDEXTTS_MEMORY_LIMIT:-20}"

fail() {
  printf 'prepare-indextts2-voice: %s\n' "$1" >&2
  exit 1
}

if [ "$#" -ne 3 ] || [ "$3" != "--i-have-permission" ]; then
  fail "usage: $0 <authorized-reference-audio> <speaker-v2.npz> --i-have-permission"
fi

REFERENCE="$1"
SPEAKER_OUT="$2"

[ -f "${REFERENCE}" ] || fail "reference audio not found: ${REFERENCE}"
[ -d "${RUNTIME_DIR}" ] || fail "runtime missing; run scripts/setup-indextts2-mlx.sh first"
[ -d "${MODEL_DIR}" ] || fail "model missing; run scripts/setup-indextts2-mlx.sh first"
command -v uv >/dev/null 2>&1 || fail "uv is not installed"
command -v ffmpeg >/dev/null 2>&1 || fail "ffmpeg is not installed"

case "${REFERENCE}" in
  /*) REFERENCE_ABS="${REFERENCE}" ;;
  *) REFERENCE_ABS="$(pwd)/${REFERENCE}" ;;
esac
case "${SPEAKER_OUT}" in
  /*) SPEAKER_ABS="${SPEAKER_OUT}" ;;
  *) SPEAKER_ABS="$(pwd)/${SPEAKER_OUT}" ;;
esac

mkdir -p "$(dirname "${SPEAKER_ABS}")"
NORMALIZED="${SPEAKER_ABS%.npz}.normalized-reference.wav"
trap 'rm -f "${NORMALIZED}"' EXIT

ffmpeg -y -loglevel error -i "${REFERENCE_ABS}" \
  -af "highpass=f=75,lowpass=f=14000,afftdn=nf=-28,loudnorm=I=-20:TP=-2:LRA=7" \
  -ar 22050 -ac 1 "${NORMALIZED}"

(
  cd "${RUNTIME_DIR}"
  uv run mlx-indextts speaker \
    -m "${MODEL_DIR}" \
    -r "${NORMALIZED}" \
    -o "${SPEAKER_ABS}" \
    --memory-limit "${MEMORY_LIMIT}"
)

printf 'Private speaker conditioning saved to: %s\n' "${SPEAKER_ABS}"
printf 'Do not commit the reference audio or speaker .npz to a public repository.\n'
