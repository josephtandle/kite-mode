# Kite Mode

A sanctioned expanded-thinking window for Claude Code (and, with less enforcement, Codex). You open it on purpose, it runs for a fixed time, every idea is captured, nothing is executed, and it ends with a reel-in that scores what you found and tells you honestly whether you are onto something or it was the altitude.

It is the counterpart to a focus guard. A focus guard keeps you on the task. Kite Mode is the window where you are allowed to leave it, with a string attached.

## Why explicit only

Expanded thinking is cheap to start and expensive to stop. If a tool can decide on its own that now is a good time to think big, it will do it at 1am, on the task with the deadline, and the ideas will feel like decisions. So Kite Mode never opens by itself. The skill text refuses to infer it; the CLI refuses to open a topic phrased "quick", "just", "standard" or "urgent"; and no hook fires unless `active.json` exists, which only `kite open` creates.

Say one of these and the agent opens a window:

- "kite mode" / "fly a kite on this"
- "expanded idea mode" / "let's think big on X"

Anything else, including an obviously open-ended question, is not an invocation.

## Install

Needs Node 18 or newer and bash. No npm packages.

```bash
git clone https://github.com/josephtandle/kite-mode ~/kite-mode
~/kite-mode/install.sh
```

The installer:

- symlinks the skill into `~/.claude/skills/kite-mode` and `~/.codex/skills/kite-mode`
- adds three hooks to `~/.claude/settings.json` (idempotent; it checks for its own entries before adding)
- creates `$KITE_HOME` (default `~/.kite`) for windows and the ledger
- links the CLI to `~/.local/bin/kite`

Restart Claude Code afterwards. `./uninstall.sh` reverses all of it and leaves your capture docs alone.

## The tether, and how the hooks enforce it

While a window is open:

- nothing sends, buys, deploys, pushes, commits, names or prices anything
- nothing edits any file except the capture doc
- the window ends on time; extension is by explicit request and the reel-in still runs

This is not a promise in a prompt. In Claude Code it is three hooks:

| Hook | What it does while `active.json` exists |
|---|---|
| `UserPromptSubmit` | Prints a banner on every turn: `KITE WINDOW OPEN until HH:MM (N min left) \| topic \| capture doc \| capture everything, execute nothing`. After the end time it says `window ended, run the reel-in now`. |
| `PreToolUse` | Allows read-only tools (Read, Grep, Glob, WebSearch, WebFetch, LS). Allows Edit/Write/NotebookEdit only when the target is the capture doc. Allows Bash only for clearly read-only commands (ls, cat, grep, rg, find, head, tail, wc, echo, git status/log/diff/show, `node -e` that prints, the `kite` CLI). Everything else, and anything matching send, mail, `curl -X POST`, deploy, vercel, npm publish, git push, git commit, rm, mv, purchase, stripe or wa-send, is denied with exit 2 and the one-line reason `Kite window open: that is a morning move, captured it`. The attempt is appended to the capture doc under `## Morning moves`, so nothing is lost. MCP tools are allowed only when their name reads as a read (`read`, `search`, `get`, `list`, `fetch`, `query`). |
| `Stop` | If the window has expired, prints a reminder to run the reel-in. It never blocks. |

When no window is open all three print nothing and exit 0. They cost one `node` start each.

Things the hooks cannot do, said plainly: they cannot stop you, the human, from opening another terminal. They cannot see what a sub-process does after a command was allowed (which is why the Bash allowlist is short and the default is deny). And they only exist in Claude Code; see the Codex note.

## The reel-in

The window has two roles with a hard wall between them. Inside the window the agent is a generator: yes-and, volume over precision, the first three obvious ideas are banned, evaluation is forbidden, optional frames (regulator, ten-year-old, zero budget, speedrunner, hardware engineer) break anchoring when ideas repeat.

At close the agent becomes the critic and writes `## Reel-in` into the capture doc:

1. harvest everything into the doc
2. score each idea for novelty, viability and fit, 0 to 10
3. cluster by underlying angle
4. flag traps with one-line reasons
5. deepen the top 3: sketch, load-bearing risk, first small move
6. give the deferred criticisms their hearing
7. conviction check: morning, money, wedge, you, source
8. verdict: **onto something / maybe / it was the altitude**
9. next-morning list, at most 3 items, recommended one first, all marked awaiting go

`kite close` prints this checklist and refuses to close until the section exists. The verdict goes to `$KITE_HOME/ledger.jsonl`. The next day, `kite morning "<what you confirmed>"` records what survived daylight, so over time you can see how often the reel-in was right. The full doc format is in [docs/capture-format.md](docs/capture-format.md).

## CLI

```
kite open "<topic>" [--minutes N] [--doc path] [--energy low|normal]
    writes $KITE_HOME/active.json and creates the capture doc.
    default 120 minutes, 60 when --energy low. Refuses quick/just/standard/urgent topics.
kite status
    open or ended, minutes left, idea count, whether the reel-in is written.
kite capture "<text>" [--frame name] [--parent n]
    appends "- [n] <text> | frame: <name> | parent: <n|none>" under ## Ideas.
kite frame [name|list]
    prints one frame (random when no name).
kite close [--force]
    prints the reel-in checklist, refuses without a ## Reel-in section unless --force,
    appends to ledger.jsonl, removes active.json.
kite morning "<verdict>" [--topic "<topic>"]
    appends what the morning review confirmed to the ledger.
kite ledger
    prints the history and verdict counts.
```

`KITE_HOME` overrides the state directory (default `~/.kite`). Windows live in `$KITE_HOME/windows/<date>-<slug>.md`.

## Codex note

Codex has no hooks. The skill text and the CLI still give you the whole discipline there: the pre-flight gate, the capture format, `kite status` as a manual banner, frames, the reel-in checklist and the ledger. What Codex does not get is the hard tether: nothing there denies a tool call while a window is open. If you need the guarantee, fly the kite in Claude Code.

## Privacy

Everything stays on your machine: `~/.kite` (or `$KITE_HOME`) holds the capture docs, `active.json` and `ledger.jsonl`. No network calls, no telemetry, no dependencies. The `PreToolUse` hook writes the denied tool input (command text or file path, truncated to 200 characters) into your capture doc; if a command contained something you would not want in a markdown file, edit it out of the doc.

## Tests

```bash
node --test tests/
```

## Attribution

Shapes and ideas were adapted from these MIT-licensed projects. No text was copied verbatim; each is credited for the pattern it contributed.

- [UditAkhourii/adhd](https://github.com/UditAkhourii/adhd): the generator/critic hard wall, the pre-flight gate on "quick/standard/just" phrasing, the frames table, and the reel-in scoring (novelty, viability, fit; cluster; traps; deepen the top 3).
- [lazyfoxjumps/Loft-Hours](https://github.com/lazyfoxjumps/Loft-Hours): the intake (goal, length, energy), the per-session log and the rollup method behind the window ledger.
- [fercreek/focus-adhd](https://github.com/fercreek/focus-adhd): the decision budget that caps the next-morning list at 3 with the recommended item first.
- [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd): the one-next-action close.

## License

All Sorted Personal Use License: use it for yourself, never sell or redistribute it. See LICENSE.
