#!/usr/bin/env bash
# Scan tracked files for forbidden literals supplied via env.
#
# Usage:
#   FORBIDDEN_LITERALS="secret1,secret2" scripts/ci/check-forbidden-literals.sh
#
# Behavior:
#   - Reads forbidden literals from $FORBIDDEN_LITERALS (comma- or newline-separated).
#   - If unset or empty: exits 0 (no-op). Local devs without the secret are not blocked.
#   - If set: greps each literal across `git ls-files`. Any match exits 1.
#   - The literals themselves are never written to disk or to logs (only the
#     count is reported); matches are reported as "<literal-redacted>: <file>:<line>".
#
# Wire into CI via a repo secret named FORBIDDEN_LITERALS.

set -u

if [ -z "${FORBIDDEN_LITERALS:-}" ]; then
  echo "check-forbidden-literals: FORBIDDEN_LITERALS not set, skipping."
  exit 0
fi

# Normalize separators (commas + newlines) into a newline-separated list.
literals=$(printf '%s' "$FORBIDDEN_LITERALS" | tr ',' '\n' | sed '/^$/d')

if [ -z "$literals" ]; then
  echo "check-forbidden-literals: FORBIDDEN_LITERALS is empty after normalization, skipping."
  exit 0
fi

count=$(printf '%s\n' "$literals" | wc -l | tr -d ' ')
echo "check-forbidden-literals: scanning tracked files for $count forbidden literal(s)..."

# Allow this script itself and its CI workflow to be excluded so the pattern
# can't trip on documentation of the guard. Tracked-file list:
tracked=$(git ls-files \
  | grep -v '^scripts/ci/check-forbidden-literals.sh$' \
  || true)

if [ -z "$tracked" ]; then
  echo "check-forbidden-literals: no tracked files found, skipping."
  exit 0
fi

violations=0
while IFS= read -r literal; do
  [ -z "$literal" ] && continue
  # -F: fixed string. -n: line numbers. -I: skip binaries. xargs -d '\n' to be safe with spaces.
  hits=$(printf '%s\n' "$tracked" | xargs -I{} grep -FInH -- "$literal" "{}" 2>/dev/null || true)
  if [ -n "$hits" ]; then
    # Print matches without echoing the literal itself.
    while IFS= read -r line; do
      file_and_line=$(printf '%s' "$line" | cut -d: -f1,2)
      echo "  forbidden literal hit: $file_and_line"
      violations=$((violations + 1))
    done <<EOF
$hits
EOF
  fi
done <<EOF
$literals
EOF

if [ "$violations" -gt 0 ]; then
  echo "check-forbidden-literals: FAIL — $violations match(es) found."
  exit 1
fi

echo "check-forbidden-literals: OK — no matches."
exit 0
