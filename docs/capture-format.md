# Capture doc format

One doc per window. It lives at `$KITE_HOME/windows/<YYYY-MM-DD>-<slug>.md` (KITE_HOME defaults to `~/.kite`) unless the user names a path with `--doc`. It is the only file anything may edit while the window is open.

`kite open` creates it from this template:

```markdown
# Kite window: <topic>

Opened: 2026-10-01 21:30 (local)
Ends: 2026-10-01 23:30 (local)
Minutes: 120
Energy: normal
Tether: capture everything, execute nothing. Sends, purchases, deploys, pushes, naming and pricing decisions are morning moves.

## Ideas

## For the reel-in

## Morning moves
```

## `## Ideas` (append-only)

One idea per line, numbered in order of capture. Never renumber, never delete; a bad idea gets scored low at the reel-in, not erased.

```
- [n] <text> | frame: <name|none> | parent: <n|none>
```

- `n` is the next integer. `kite capture` computes it; if you edit by hand, continue the sequence.
- `frame` is the frame that produced the idea (`regulator`, `ten-year-old`, `zero-budget`, `speedrunner`, `hardware-engineer`) or `none`.
- `parent` links a variation or extension to the idea it grew from, so clusters can be rebuilt at the reel-in.
- Keep `|` out of the text; `kite capture` replaces it with `/`.

Example:

```
- [4] a kite that logs its own flight path and replays it as a drawing | frame: none | parent: none
- [5] sell the drawings, not the kites | frame: zero-budget | parent: 4
- [6] the string is the product: a reel with a tension sensor | frame: hardware-engineer | parent: 4
```

## `## For the reel-in`

Objections, feasibility worries and "but" thoughts that surfaced during the window. One per line. They are not answered here; they get their hearing at the reel-in.

```
- [5] who buys a drawing of wind
```

## `## Morning moves`

Anything the tether blocked: a send, a purchase, a deploy, a push, a rename, an edit outside this doc. The `PreToolUse` hook appends these automatically when it denies a tool call; add your own when the user asks for one in chat.

```
- 22:14 Bash: git push origin kite-ideas
- 22:40 Edit: /path/to/pricing.json
- 22:51 chat: email the three beta users about the reel idea
```

Nothing in this list runs until the morning review says so.

## `## Reel-in`

Written at close by the critic pass. `kite close` refuses to run until this heading exists (use `--force` to close without it, which the ledger records). Suggested shape:

```markdown
## Reel-in

### Scores
| n | idea | novelty | viability | fit | total |
|---|------|---------|-----------|-----|-------|
| 4 | flight path drawings | 7 | 5 | 8 | 20 |

### Clusters
- **Data as artifact** (4, 5): the flight is the product.
- **Instrumented string** (6, 9): hardware on the reel.

### Traps
- [9] needs a radio licence in most countries.

### Top 3 deepened
#### [4] flight path drawings
- Sketch: ...
- Load-bearing risk: ...
- First small move: ...

### Deferred criticisms heard
- "who buys a drawing of wind": ...

### Conviction check
- Morning: ...
- Money: ...
- Wedge: ...
- You: ...
- Source: ...

Verdict: **maybe**. One sentence of why.

### Next morning (max 3, recommended first, all awaiting go)
1. [recommended] ...
2. ...
3. ...
```

`kite close` reads the verdict from the first line matching `Verdict: onto something | maybe | it was the altitude` and writes it to the ledger.

## `## Window ledger`

Appended by `kite close`: one line per close with idea count, morning-move count and verdict. The machine-readable copy is `$KITE_HOME/ledger.jsonl`:

```
{"type":"close","closedAt":"...","openedAt":"...","topic":"...","doc":"...","ideaCount":12,"morningMoves":2,"reelIn":true,"verdict":"maybe","forced":false}
{"type":"morning","morningAt":"...","topic":"...","reelInVerdict":"maybe","confirmed":"kept 4 and 6, dropped the rest"}
```
