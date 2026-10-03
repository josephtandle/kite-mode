#!/usr/bin/env bash
# Installs the Kite Mode skill: symlinks the skill into Claude Code and Codex,
# registers the three Claude Code hooks, creates KITE_HOME, links the CLI.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KITE_HOME="${KITE_HOME:-$HOME/.kite}"
CLAUDE_SKILL_LINK="$HOME/.claude/skills/kite-mode"
CODEX_SKILL_LINK="$HOME/.codex/skills/kite-mode"
SETTINGS="$HOME/.claude/settings.json"
BIN_LINK="$HOME/.local/bin/kite"

if ! command -v node >/dev/null 2>&1; then
  echo "kite-mode needs Node 18 or newer on PATH." >&2
  exit 1
fi

mkdir -p "$(dirname "$CLAUDE_SKILL_LINK")" "$(dirname "$CODEX_SKILL_LINK")" "$KITE_HOME/windows" "$(dirname "$BIN_LINK")"
ln -sfn "$SKILL_DIR" "$CLAUDE_SKILL_LINK"
ln -sfn "$SKILL_DIR" "$CODEX_SKILL_LINK"
ln -sfn "$SKILL_DIR/bin/kite" "$BIN_LINK"
chmod +x "$SKILL_DIR/bin/kite" "$SKILL_DIR"/hooks/claude-code/*.sh

# Merge the three hooks into ~/.claude/settings.json without duplicating them.
mkdir -p "$(dirname "$SETTINGS")"
[ -f "$SETTINGS" ] || echo '{}' > "$SETTINGS"
node - "$SETTINGS" "$CLAUDE_SKILL_LINK/hooks/claude-code" <<'NODE'
const fs = require('fs');
const [settingsPath, hookDir] = process.argv.slice(2);
let s = {};
try { s = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) || {}; } catch (e) { s = {}; }
s.hooks = s.hooks && typeof s.hooks === 'object' ? s.hooks : {};
const want = { UserPromptSubmit: 'user-prompt-submit.sh', PreToolUse: 'pre-tool-use.sh', Stop: 'stop.sh' };
for (const [event, file] of Object.entries(want)) {
  const list = Array.isArray(s.hooks[event]) ? s.hooks[event] : [];
  const marker = 'kite-mode/hooks/claude-code/' + file;
  const present = list.some((e) => Array.isArray(e.hooks) && e.hooks.some((h) => typeof h.command === 'string' && h.command.includes(marker)));
  if (!present) {
    const entry = { hooks: [{ type: 'command', command: `bash "${hookDir}/${file}"`, timeout: 10 }] };
    if (event === 'PreToolUse') entry.matcher = '*';
    list.push(entry);
  }
  s.hooks[event] = list;
}
fs.writeFileSync(settingsPath, JSON.stringify(s, null, 2) + '\n');
console.log('hooks registered in ' + settingsPath);
NODE

echo "kite-mode installed"
echo "  skill:     $CLAUDE_SKILL_LINK -> $SKILL_DIR"
echo "  codex:     $CODEX_SKILL_LINK -> $SKILL_DIR"
echo "  cli:       $BIN_LINK"
echo "  state:     $KITE_HOME"
case ":$PATH:" in
  *":$HOME/.local/bin:"*) ;;
  *) echo "  note: add $HOME/.local/bin to PATH to call 'kite' directly, or use $SKILL_DIR/bin/kite" ;;
esac
echo
echo "Codex note: Codex has no hooks, so the hard tether (tool calls denied while a window is open)"
echo "is enforced in Claude Code only. In Codex the skill text and the kite CLI still give you the"
echo "capture discipline, the banner via 'kite status', and the reel-in; nothing stops a tool call there."
echo "Restart Claude Code so it picks up the new hooks."

# Weekly self-update: on by default, one line turns it off. It fast-forwards
# this clone from its origin, backs up your own files first and rolls back if
# the self-test fails.
echo ""
if [ "${KITE_MODE_SKIP_UPDATES:-0}" = "1" ]; then
  echo "Weekly updates not scheduled (KITE_MODE_SKIP_UPDATES=1). Later: node \"$SKILL_DIR/scripts/self-update.js\" --register"
else
  node "$SKILL_DIR/scripts/self-update.js" --register || echo "Weekly updates could not be scheduled. Try later: node \"$SKILL_DIR/scripts/self-update.js\" --register"
fi
