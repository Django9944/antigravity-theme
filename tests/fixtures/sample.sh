#!/usr/bin/env zsh
set -euo pipefail

THEME_DIR="${1:-./dist}"
echo "Verifying deterministic build under ${THEME_DIR}"

for file in $(find "${THEME_DIR}" -type f | sort); do
  shasum -a 256 "${file}" | awk '{print $1}'
done
