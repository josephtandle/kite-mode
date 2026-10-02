'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const KITE = path.join(ROOT, 'bin', 'kite');
const HOOKS = path.join(ROOT, 'hooks', 'claude-code');

function freshHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kite-test-'));
}
function kite(home, args, opts = {}) {
  return spawnSync(process.execPath, [KITE, ...args], { env: { ...process.env, KITE_HOME: home }, encoding: 'utf8', ...opts });
}
function hook(home, name, payload) {
  return spawnSync('bash', [path.join(HOOKS, `${name}.sh`)], {
    env: { ...process.env, KITE_HOME: home },
    input: payload === undefined ? '' : JSON.stringify(payload),
    encoding: 'utf8',
  });
}
function readActive(home) {
  return JSON.parse(fs.readFileSync(path.join(home, 'active.json'), 'utf8'));
}
function openWindow(home, topic = 'a kite about kites') {
  const r = kite(home, ['open', topic]);
  assert.equal(r.status, 0, r.stderr);
  return readActive(home);
}

test('open creates active.json and the capture doc with the right shape', () => {
  const home = freshHome();
  const r = kite(home, ['open', 'a kite about kites', '--minutes', '45']);
  assert.equal(r.status, 0, r.stderr);
  const a = readActive(home);
  assert.equal(a.topic, 'a kite about kites');
  assert.equal(a.minutes, 45);
  assert.equal(a.strictness, 'tether');
  assert.ok(a.openedAt && a.endsAt);
  assert.ok(new Date(a.endsAt) - new Date(a.openedAt) >= 45 * 60000 - 1000);
  assert.ok(fs.existsSync(a.doc));
  assert.ok(a.doc.startsWith(path.join(home, 'windows')));
  const doc = fs.readFileSync(a.doc, 'utf8');
  for (const h of ['## Ideas', '## For the reel-in', '## Morning moves']) assert.ok(doc.includes(h), h);
  assert.ok(!doc.includes('## Reel-in'));
  assert.match(r.stdout, /KITE WINDOW OPEN/);
});

test('open defaults to 120 minutes, 60 when energy is low, and respects --doc', () => {
  const home = freshHome();
  assert.equal(openWindow(home).minutes, 120);
  kite(home, ['close', '--force']);
  const r = kite(home, ['open', 'low energy topic', '--energy', 'low', '--doc', path.join(home, 'custom.md')]);
  assert.equal(r.status, 0, r.stderr);
  const a = readActive(home);
  assert.equal(a.minutes, 60);
  assert.equal(a.energy, 'low');
  assert.equal(a.doc, path.join(home, 'custom.md'));
  assert.ok(fs.existsSync(a.doc));
});

test('open refuses a second window and refuses quick/just/standard phrasing', () => {
  const home = freshHome();
  openWindow(home);
  const again = kite(home, ['open', 'another']);
  assert.equal(again.status, 1);
  assert.match(again.stderr, /already open/);
  kite(home, ['close', '--force']);
  for (const t of ['quick fix for the login bug', 'just rename the folder', 'standard weekly report']) {
    const r = kite(home, ['open', t]);
    assert.equal(r.status, 1, t);
    assert.match(r.stderr, /Pre-flight gate/);
    assert.ok(!fs.existsSync(path.join(home, 'active.json')));
  }
});

test('capture appends numbered idea lines with frame and parent', () => {
  const home = freshHome();
  const a = openWindow(home);
  assert.equal(kite(home, ['capture', 'first idea']).status, 0);
  assert.equal(kite(home, ['capture', 'second | with a pipe', '--frame', 'regulator']).status, 0);
  const r3 = kite(home, ['capture', 'child of two', '--parent', '2']);
  assert.equal(r3.status, 0);
  assert.match(r3.stdout, /\[3\] captured/);
  const doc = fs.readFileSync(a.doc, 'utf8');
  assert.ok(doc.includes('- [1] first idea | frame: none | parent: none'));
  assert.ok(doc.includes('- [2] second / with a pipe | frame: regulator | parent: none'));
  assert.ok(doc.includes('- [3] child of two | frame: none | parent: 2'));
  const ideasStart = doc.indexOf('## Ideas');
  const nextHeading = doc.indexOf('## For the reel-in');
  assert.ok(doc.indexOf('- [3]') > ideasStart && doc.indexOf('- [3]') < nextHeading, 'ideas stay inside the Ideas section');
  assert.match(kite(home, ['status']).stdout, /ideas captured: 3/);
});

test('capture refuses when no window is open', () => {
  const home = freshHome();
  const r = kite(home, ['capture', 'orphan idea']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /No kite window open/);
});

test('frame prints a named frame, a random one, and the list', () => {
  const home = freshHome();
  const named = kite(home, ['frame', 'speedrunner']);
  assert.equal(named.status, 0);
  assert.match(named.stdout, /^frame: speedrunner/);
  const random = kite(home, ['frame']);
  assert.equal(random.status, 0);
  assert.match(random.stdout, /^frame: (regulator|ten-year-old|zero-budget|speedrunner|hardware-engineer)/);
  const list = kite(home, ['frame', 'list']);
  assert.equal(list.stdout.trim().split('\n').length, 5);
  assert.equal(kite(home, ['frame', 'nope']).status, 1);
});

test('pre-tool-use denies an Edit outside the doc with exit 2 and records the morning move', () => {
  const home = freshHome();
  const a = openWindow(home);
  const r = hook(home, 'pre-tool-use', { tool_name: 'Edit', tool_input: { file_path: '/somewhere/else/app.js', old_string: 'a', new_string: 'b' } });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Kite window open: that is a morning move, captured it/);
  const doc = fs.readFileSync(a.doc, 'utf8');
  assert.match(doc, /## Morning moves\n\n- \d\d:\d\d Edit: \/somewhere\/else\/app\.js/);
});

test('pre-tool-use denies Bash git push and other morning moves, records each', () => {
  const home = freshHome();
  const a = openWindow(home);
  const denied = [
    'git push origin main',
    'git commit -m "x"',
    'npm publish',
    'vercel --prod',
    'curl -X POST https://example.com/api',
    'rm -rf build',
    'mv a b',
    'echo hi > notes.txt',
    'node -e "require(\'fs\').writeFileSync(\'x\',\'y\')"',
    'npm test',
  ];
  for (const command of denied) {
    const r = hook(home, 'pre-tool-use', { tool_name: 'Bash', tool_input: { command } });
    assert.equal(r.status, 2, `should deny: ${command}`);
    assert.match(r.stderr, /morning move/);
  }
  const doc = fs.readFileSync(a.doc, 'utf8');
  assert.ok(doc.includes('Bash: git push origin main'));
  assert.ok(doc.includes('Bash: npm publish'));
});

test('pre-tool-use allows read-only tools, read-only Bash, and an Edit to the doc', () => {
  const home = freshHome();
  const a = openWindow(home);
  const allowed = [
    { tool_name: 'Read', tool_input: { file_path: '/etc/hosts' } },
    { tool_name: 'Grep', tool_input: { pattern: 'x' } },
    { tool_name: 'Glob', tool_input: { pattern: '**/*.md' } },
    { tool_name: 'WebSearch', tool_input: { query: 'kites' } },
    { tool_name: 'WebFetch', tool_input: { url: 'https://example.com' } },
    { tool_name: 'Edit', tool_input: { file_path: a.doc, old_string: 'a', new_string: 'b' } },
    { tool_name: 'Write', tool_input: { file_path: a.doc, content: 'x' } },
    { tool_name: 'Bash', tool_input: { command: 'ls -la' } },
    { tool_name: 'Bash', tool_input: { command: 'git status && git log --oneline | head -5' } },
    { tool_name: 'Bash', tool_input: { command: 'grep -rn kite docs 2>/dev/null' } },
    { tool_name: 'Bash', tool_input: { command: 'node -e "console.log(1+1)"' } },
    { tool_name: 'Bash', tool_input: { command: 'kite capture "an idea from the shell"' } },
    { tool_name: 'Bash', tool_input: { command: `node ${KITE} status` } },
  ];
  for (const p of allowed) {
    const r = hook(home, 'pre-tool-use', p);
    assert.equal(r.status, 0, `should allow: ${JSON.stringify(p)} ${r.stderr}`);
    assert.equal(r.stdout, '');
  }
  const doc = fs.readFileSync(a.doc, 'utf8');
  assert.ok(!/## Morning moves\n\n- /.test(doc), 'nothing recorded for allowed calls');
});

test('pre-tool-use prints nothing and exits 0 when no window is open', () => {
  const home = freshHome();
  const r = hook(home, 'pre-tool-use', { tool_name: 'Bash', tool_input: { command: 'git push' } });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
  assert.equal(r.stderr, '');
});

test('user-prompt-submit prints the banner while open, the ended notice after expiry, nothing when closed', () => {
  const home = freshHome();
  const closed = hook(home, 'user-prompt-submit');
  assert.equal(closed.status, 0);
  assert.equal(closed.stdout, '');
  const a = openWindow(home);
  const open = hook(home, 'user-prompt-submit');
  assert.equal(open.status, 0);
  assert.match(open.stdout, /^KITE WINDOW OPEN until \d\d:\d\d \(\d+ min left\) \| topic: a kite about kites \| capture doc: .+ \| capture everything, execute nothing/);
  a.endsAt = new Date(Date.now() - 5 * 60000).toISOString();
  fs.writeFileSync(path.join(home, 'active.json'), JSON.stringify(a));
  const ended = hook(home, 'user-prompt-submit');
  assert.equal(ended.status, 0);
  assert.match(ended.stdout, /window ended, run the reel-in now/);
});

test('stop prints the reel-in reminder only for an expired window and never blocks', () => {
  const home = freshHome();
  assert.equal(hook(home, 'stop').stdout, '');
  const a = openWindow(home);
  assert.equal(hook(home, 'stop').stdout, '');
  a.endsAt = new Date(Date.now() - 60000).toISOString();
  fs.writeFileSync(path.join(home, 'active.json'), JSON.stringify(a));
  const r = hook(home, 'stop');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Run the reel-in now/);
});

test('close refuses without a reel-in section, succeeds with --force and writes the ledger', () => {
  const home = freshHome();
  const a = openWindow(home);
  kite(home, ['capture', 'one']);
  kite(home, ['capture', 'two']);
  const refused = kite(home, ['close']);
  assert.equal(refused.status, 1);
  assert.match(refused.stdout, /REEL-IN CHECKLIST/);
  assert.match(refused.stderr, /no "## Reel-in" section/);
  assert.ok(fs.existsSync(path.join(home, 'active.json')));
  const forced = kite(home, ['close', '--force']);
  assert.equal(forced.status, 0, forced.stderr);
  assert.ok(!fs.existsSync(path.join(home, 'active.json')));
  const ledger = fs.readFileSync(path.join(home, 'ledger.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].type, 'close');
  assert.equal(ledger[0].topic, 'a kite about kites');
  assert.equal(ledger[0].ideaCount, 2);
  assert.equal(ledger[0].verdict, null);
  assert.equal(ledger[0].forced, true);
  assert.ok(ledger[0].closedAt);
  assert.match(fs.readFileSync(a.doc, 'utf8'), /## Window ledger\n\n- closed .* 2 ideas/);
});

test('close reads the verdict from the reel-in and morning appends the confirmation', () => {
  const home = freshHome();
  const a = openWindow(home, 'a verdict topic');
  kite(home, ['capture', 'one']);
  fs.appendFileSync(a.doc, '\n## Reel-in\n\n### Conviction check\n\nVerdict: **maybe**. The wedge is unclear.\n');
  const r = kite(home, ['close']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /verdict: maybe/);
  const m = kite(home, ['morning', 'kept idea 1, dropped the rest']);
  assert.equal(m.status, 0, m.stderr);
  const ledger = fs.readFileSync(path.join(home, 'ledger.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(ledger.length, 2);
  assert.equal(ledger[0].verdict, 'maybe');
  assert.equal(ledger[1].type, 'morning');
  assert.equal(ledger[1].topic, 'a verdict topic');
  assert.equal(ledger[1].reelInVerdict, 'maybe');
  assert.equal(ledger[1].confirmed, 'kept idea 1, dropped the rest');
  assert.match(kite(home, ['ledger']).stdout, /windows closed: 1, morning reviews: 1/);
});

test('bashIsReadOnly unit cases', () => {
  const { bashIsReadOnly } = require(KITE);
  for (const ok of ['ls', 'cat README.md', 'rg -n tether SKILL.md', 'find . -name "*.md"', 'git diff --stat', 'wc -l file', 'echo hello', 'tail -n 20 log.txt 2>&1']) {
    assert.equal(bashIsReadOnly(ok), true, ok);
  }
  for (const bad of ['', 'find . -delete', 'find . -exec rm {} +', 'cat x | xargs rm', 'sed -i s/a/b/ f', 'git branch -D x && ls', 'ls $(rm x)', 'FOO=1 ls', '/usr/bin/python3 -c 1', 'stripe charges create', 'wa-send hi', 'ls; ssh host']) {
    assert.equal(bashIsReadOnly(bad), false, bad);
  }
});
