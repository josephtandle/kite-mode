# Changelog

## 1.0.0 (2026-10-01)

First public release.

- Explicit-only invocation with a pre-flight gate (CLI refuses quick/just/standard/urgent topics).
- `kite` CLI: open, status, capture, frame, close, morning, ledger. Node 18+, no dependencies.
- Capture doc format: append-only numbered ideas with frame and parent, deferred objections, morning moves, reel-in, window ledger.
- Claude Code hooks: UserPromptSubmit banner, PreToolUse tether (writes only to the capture doc, read-only Bash allowlist, denials recorded as morning moves), Stop reminder.
- Reel-in: scores, clusters, traps, top 3 deepened, conviction check, verdict, next-morning list capped at 3.
- Ledger with morning-review follow-up for calibration.
- install.sh / uninstall.sh with idempotent settings.json merge; Codex gets the discipline, Claude Code gets the hard tether.
- Tests under `tests/` (node:test).
