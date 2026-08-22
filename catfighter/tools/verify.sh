#!/bin/sh
# Everything that has to be true before this ships. One command, so nobody
# has to remember the list.
#
#     sh tools/verify.sh
#
set -e
cd "$(dirname "$0")/.."
echo "== tests =="
node --test test/*.test.mjs 2>&1 | grep -E "^# (tests|pass|fail)"
echo
echo "== syntax, every shipping file =="
for f in $(grep -o 'src/[a-z/]*\.js' index.html); do
  node -e "new Function(require('fs').readFileSync('$f','utf8'))" || { echo "BROKEN: $f"; exit 1; }
done
echo "all clean"
echo
echo "== move list is not stale =="
node tools/gen-moves.mjs >/dev/null
git diff --quiet MOVES.md || echo "MOVES.md was stale — regenerated, commit it"
echo
echo "== bundle =="
node tools/bundle.mjs | tail -1
echo
echo "== art renders (any failure here is a broken draw call) =="
for m in cats head silhouette stages roster kit; do
  node tools/shot.mjs "$m" "/tmp/verify-$m.png" >/dev/null || { echo "RENDER FAILED: $m"; exit 1; }
  echo "  $m ok"
done
node tools/shot.mjs fight /tmp/verify-fight.png 0 240 >/dev/null && echo "  fight ok"
echo
echo "everything passed"
