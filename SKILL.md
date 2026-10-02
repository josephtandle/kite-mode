---
name: kite-mode
description: "Sanctioned expanded-thinking window, opened only on explicit request: timeboxed creative divergence with a hard tether (capture everything, execute nothing) and a mandatory reel-in with scoring and a conviction check."
---

# Kite Mode

Kite Mode is the deliberate counterpart to a focus guard. A focus guard keeps you on the task; Kite Mode grants a window to leave it on purpose. You let out string, the kite goes where the wind takes it, and it never stops being tethered. Reeling it in is part of flying it.

## Invocation: explicit only

Kite Mode is never on by default and never inferred. Open it only when the user says so, in words like:

- "kite mode", "fly a kite on this", "let's fly a kite"
- "expanded idea mode", "idea expansion", "let's think big on X"
- "relax the guardrails on this one", "this is playtime"

A big open question, an excited user, or a late hour is not an invocation. If you think a kite would help, you may suggest it in one line; you do not open it.

Never use it for autonomous runs, scheduled jobs, or background work, and never as a way around an approval gate. It is explicitly not that.

## Pre-flight gate

Before opening, check the topic. Refuse (politely, in two lines) and do the task directly instead when:

- the topic has a live deadline inside or near the window
- it is phrased as "quick", "just", "standard", "urgent", "asap" (the CLI refuses these too)

Otherwise confirm, in one message:

1. **Topic**, in the user's words.
2. **Duration**: default 120 minutes. If the user says energy is low, default 60. The user can set any number.
3. **End time** in the user's local time.
4. **Capture doc path**: `$KITE_HOME/windows/<YYYY-MM-DD>-<slug>.md` (KITE_HOME defaults to `~/.kite`) unless the user names a path.

Then run `kite open "<topic>" [--minutes N] [--energy low] [--doc path]`. That writes `active.json`, creates the doc from the template, and arms the hooks. State the tether once. Do not repeat it every message; that kills the play.

## What changes inside the window

- **Yes-and by default.** Build on an idea before you touch it. Criticism is deferred, not deleted: park objections under `## For the reel-in` in the doc.
- **Volume over precision.** Variations, inversions, adjacent plays, mashups with what the user already has. Ten wild ideas beat two safe ones.
- **Generator/critic hard wall.** Inside the window you are the generator. Evaluation is forbidden: no "is this realistic", no feasibility notes, no ranking. The critic runs at the reel-in and nowhere else. Mixing the two kills idea quality.
- **The first three obvious ideas are banned.** Everyone has them. Note them, skip them, start at idea four.
- **Capture every idea as you go**, one line each, via `kite capture "<text>" [--frame name] [--parent n]` or by editing the doc. Nothing lives only in chat. An idea that exists only in a late-night chat is an idea lost.
- **Frames break anchoring.** When ideas start repeating, pull one with `kite frame` (random) or by name: `regulator`, `ten-year-old`, `zero-budget`, `speedrunner`, `hardware-engineer`. Tag ideas with the frame that produced them.
- **Research is welcome when it feeds ideas**: precedents, analogies, adjacent markets, what others tried. Not to kill ideas early.
- **Style:** match the user's energy. Co-conspirator, not chaperone. Short bursts, riffs and lists are fine here. One light touch of grounding per window at most, unless something crosses the tether.

## The tether (never changes, whatever the mode)

While a window is open:

- Nothing sends to a real person: no email, DM, chat message, post, invite. Drafts go in the doc.
- No purchases, domain buys, incorporations, payments, pricing or billing changes.
- No deploys, publishes, pushes or commits. No naming or branding decisions: names generated in-window are candidates.
- No edits to anything except the capture doc. No file moves or deletions.
- Everything is captured to the doc.
- The window ends on time. The user may extend it by saying so explicitly; the reel-in still runs at the end.

When the user proposes something the tether blocks, do not lecture. Say "that is a morning move, captured it", write it under `## Morning moves`, and keep flying.

In Claude Code this is enforced by hooks, not by this text: while `active.json` exists, `PreToolUse` denies every write outside the capture doc and every non-read-only shell command, records the attempt under `## Morning moves`, and `UserPromptSubmit` shows the window banner on every turn. If a hook blocks you, that was the tether working. Do not look for another route.

## The reel-in (mandatory at window close)

When the clock runs out, or the user calls it, switch roles: you are now the critic. Write all of this under `## Reel-in` in the capture doc (format in `docs/capture-format.md`), then run `kite close`. The CLI refuses to close without that section.

1. **Harvest.** Every idea, name, mechanic and open question is in the doc, not only in chat.
2. **Score each idea** on novelty, viability and fit, 0 to 10 each.
3. **Cluster by underlying angle**, not by keyword. Name each cluster.
4. **Flag traps** with a one-line reason each: the idea that only works at 2am, the one that needs a permission nobody will give, the one that is a different business.
5. **Deepen the top 3**: a short sketch, the load-bearing risk, and the first small move that would test it in a week.
6. **Deferred criticisms get their hearing.** Walk the `## For the reel-in` list and answer each one honestly.
7. **Conviction check**, one line each:
   - Morning test: would this still excite you, well slept?
   - Money test: is there one person who would plausibly pay for this within 30 days?
   - Wedge test: is there a first move small enough to try in a week?
   - You test: are you unusually placed to do this, or could anyone?
   - Source test: is the excitement coming from the idea, or from the state?
   **Verdict: onto something / maybe / it was the altitude**, with one sentence of why.
8. **Next-morning list**: at most 3 items, the recommended one first, every one marked **awaiting go**. Nothing on it runs tonight.
9. **Morning moves** stay a list until the morning review says otherwise.

The verdict is advisory. The user decides in the morning. Your job is to make the morning version of the idea complete, honest and reviewable.

## Window ledger

`kite close` appends `{closedAt, topic, ideaCount, morningMoves, verdict}` to `$KITE_HOME/ledger.jsonl`. The next day, after the user reviews the list, run `kite morning "<what was confirmed>"` to append the morning outcome beside the reel-in verdict. `kite ledger` prints the history. Over time, compare verdicts to outcomes and tune the conviction tests; note what you learn in `LEARNING.md`.

## CLI quick reference

```
kite open "<topic>" [--minutes N] [--doc path] [--energy low|normal]
kite status
kite capture "<idea>" [--frame name] [--parent n]
kite frame [name|list]
kite close [--force]
kite morning "<what the morning review confirmed>"
kite ledger
```
