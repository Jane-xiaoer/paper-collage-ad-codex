#!/usr/bin/env bash

# Install the third-party MLX IndexTTS-2 runtime and converted model locally.
# No reference voice or generated speaker file is copied into this skill.

set -euo pipefail

RUNTIME_DIR="${PAPER_COLLAGE_TTS_HOME:-${HOME}/.local/share/paper-collage-ad/mlx-indextts}"
MODEL_REPO="${INDEXTTS_MODEL_REPO:-vanch007/mlx-indextts2-standard-fp16}"
MODEL_DIR="${INDEXTTS_MODEL_DIR:-${RUNTIME_DIR}/models/mlx-indextts2-standard-fp16}"
SOURCE_REPO="${INDEXTTS_MLX_REPO:-https://github.com/solar2ain/mlx-indextts.git}"

fail() {
  printf 'setup-indextts2-mlx: %s\n' "$1" >&2
  exit 1
}

for tool in git uv hf; do
  command -v "${tool}" >/dev/null 2>&1 || fail "missing ${tool}; see references/dependencies.md"
done

if [ "$(uname -s)" != "Darwin" ] || [ "$(uname -m)" != "arm64" ]; then
  fail "this MLX route requires macOS on Apple Silicon"
fi

mkdir -p "$(dirname "${RUNTIME_DIR}")"

if [ -d "${RUNTIME_DIR}/.git" ]; then
  printf 'Updating MLX IndexTTS runtime at %s\n' "${RUNTIME_DIR}"
  git -C "${RUNTIME_DIR}" pull --ff-only
elif [ -e "${RUNTIME_DIR}" ]; then
  fail "runtime path exists but is not a git checkout: ${RUNTIME_DIR}"
else
  git clone "${SOURCE_REPO}" "${RUNTIME_DIR}"
fi

(
  cd "${RUNTIME_DIR}"
  uv sync
  uv pip install einops
)

mkdir -p "${MODEL_DIR}"
hf download "${MODEL_REPO}" --local-dir "${MODEL_DIR}"

printf '\nIndexTTS-2 MLX is ready.\n'
printf 'Runtime: %s\n' "${RUNTIME_DIR}"
printf 'Model:   %s\n' "${MODEL_DIR}"
