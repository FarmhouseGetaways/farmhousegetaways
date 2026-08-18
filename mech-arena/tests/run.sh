#!/usr/bin/env bash
# Runs the ground-contact checks against the real code in the server script.
# Needs the Luau binary; fetches it into tests/.bin on first run.
set -euo pipefail
cd "$(dirname "$0")/.."

LUAU="tests/.bin/luau"
if [ ! -x "$LUAU" ]; then
	echo "Fetching the Luau binary..."
	mkdir -p tests/.bin
	curl -sSL -o tests/.bin/luau.zip \
		"https://github.com/luau-lang/luau/releases/latest/download/luau-ubuntu.zip"
	unzip -o -q tests/.bin/luau.zip -d tests/.bin
	chmod +x tests/.bin/luau*
fi

echo "Compiling the scripts..."
tests/.bin/luau-compile --binary src/MechArena.server.lua > /dev/null
tests/.bin/luau-compile --binary src/MechAim.client.lua  > /dev/null
echo "  both compile."

# Pull the geometry section straight out of the server script so the test can
# never drift away from the code it is checking.
BUILD="tests/.bin/geometry-check.lua"
{
	cat tests/roblox-stubs.lua
	sed -n '/--@geometry-begin/,/--@geometry-end/p' src/MechArena.server.lua
	cat tests/geometry.test.lua
} > "$BUILD"

"$LUAU" "$BUILD"
