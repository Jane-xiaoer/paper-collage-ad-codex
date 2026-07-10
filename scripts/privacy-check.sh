#!/usr/bin/env bash

# Fail when likely secrets or private voice artifacts are tracked by git.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

fail=0

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git ls-files | grep -E '(^|/)(voice-reference|voice-model|voice-raw|voice-final)/|\.(npz|wav|aiff|mp3|m4a)$' >/dev/null; then
    printf 'privacy-check: tracked private voice or generated audio artifact found\n' >&2
    fail=1
  fi
fi

if rg -n --hidden \
  -g '!scripts/privacy-check.sh' \
  -g '!.git/**' \
  '(sk-[A-Za-z0-9_-]{20,}|gh[opsu]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----)' .; then
  printf 'privacy-check: possible credential found\n' >&2
  fail=1
fi

if [ "${fail}" -ne 0 ]; then
  exit 1
fi

printf 'privacy-check: no tracked voice assets or obvious credentials found\n'
