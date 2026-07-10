#!/usr/bin/env bash
# Preflight dependency check for the paper-collage-ad skill.
# Run this before generating anything. Core tools must pass; audio-cloning
# extras are only required when you use reference-voice narration.
#
#   bash <SKILL_DIR>/scripts/check-deps.sh
#
# Exit code 0 = ready for the core pipeline (render / layer-animate / assemble).
# Exit code 1 = a core tool is missing; nothing downstream will work.

set -u

ok=0
core_missing=0

say_line() {
  # $1 status (OK/MISS/warn) $2 name $3 note
  local status="$1" name="$2" note="$3" mark
  case "${status}" in
    OK)   mark="  ok " ;;
    MISS) mark="MISS " ;;
    warn) mark=" -- " ;;
  esac
  printf '  [%s] %-10s %s\n' "${mark}" "${name}" "${note}"
}

have() { command -v "$1" >/dev/null 2>&1; }

echo "paper-collage-ad :: dependency preflight"
echo
echo "Core (required for render.mjs / layer-animate.mjs / assemble.mjs):"
for tool in ffmpeg ffprobe node bash; do
  if have "${tool}"; then
    ver="$("${tool}" -version 2>/dev/null | head -1 || true)"
    [ -z "${ver}" ] && ver="$("${tool}" --version 2>/dev/null | head -1 || true)"
    say_line OK "${tool}" "${ver}"
  else
    say_line MISS "${tool}" "not on PATH"
    core_missing=1
  fi
done

echo
echo "Reference-voice cloning (only for extract-reference-voice.sh + IndexTTS-2):"
for tool in uv uvx hf; do
  if have "${tool}"; then
    say_line OK "${tool}" "$(command -v "${tool}")"
  else
    say_line warn "${tool}" "absent (skip only if not cloning a voice)"
  fi
done

echo
echo "Local TTS fallback:"
if have say; then
  say_line OK "say" "macOS 'say' available (use -v Tingting for Chinese)"
else
  say_line warn "say" "absent (non-macOS; supply your own TTS)"
fi

echo
if [ "${core_missing}" -eq 0 ]; then
  echo "Core toolchain ready. You can run the full render/animate/assemble pipeline."
  exit 0
else
  echo "A core tool is missing. Install it before running any pipeline script."
  echo "  macOS: brew install ffmpeg ; and install Node.js (nvm or brew)."
  exit 1
fi
