#!/usr/bin/env bash
# Removes the Kite Mode skill links and its Claude Code hook entries.
# Leaves KITE_HOME (your capture docs and ledger) untouched.
set -euo pipefail

SETTINGS="$HOME/.claude/settings.json"
rm -f "$HOME/.claude/skills/kite-mode" "$HOME/.codex/skills/kite-mode" "$HOME/.local/bin/kite"

if [ -f "$SETTINGS" ] && command -v node >/dev/null 2>&1; then
node - "$SETTINGS" <<'NODE'
const fs = require('fs');
const settingsPath = process.argv[2];
let s;
try { s = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch (e) { process.exit(0); }
if (!s || typeof s.hooks !== 'object') process.exit(0);
const marker = 'kite-mode/hooks/claude-code/';
for (const event of Object.keys(s.hooks)) {
  if (!Array.isArray(s.hooks[event])) continue;
  s.hooks[event] = s.hooks[event].filter((e) => !(Array.isArray(e.hooks) && e.hooks.some((h) => typeof h.command === 'string' && h.command.includes(marker))));
  if (!s.hooks[event].length) delete s.hooks[event];
}
if (!Object.keys(s.hooks).length) delete s.hooks;
fs.writeFileSync(settingsPath, JSON.stringify(s, null, 2) + '\n');
console.log('kite hooks removed from ' + settingsPath);
NODE
fi

KITE_HOME="${KITE_HOME:-$HOME/.kite}"
echo "kite-mode uninstalled. Your windows and ledger are still in $KITE_HOME; delete that folder yourself if you want them gone."
