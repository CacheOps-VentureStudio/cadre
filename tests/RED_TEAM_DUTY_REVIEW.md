# Duty reconciliation independent Red Team review

Final scoped verdict: the four initial reconciliation findings are corrected in the revised source, with no unresolved new duty-reconciliation defect found in the tested cases. This is a scoped independent review, not release qualification or approval. Initial findings and evidence are retained below as historical records.

Reviewed source: index.html SHA-256 `1f398aab6238f6503cf09f2ccb1841e5c6e831265912f5356bf902d05977170a`, uncommitted diff over `589d74fb0bfc66bb10e8530e748e9716b12acbb8`. Repository instructions read: CONTRIBUTING.md; no AGENTS.md found in the scoped ancestor paths. Review was read-only in the repository. Only synthetic fixtures, probes and this report were written in the task workspace.

## Initial findings — all four corrected on retest

1. **P1: Existing local base duties are silently deleted on first update.** `index.html:1609` treats every prior role duty as card-owned when preset.scope is absent; `1646` and `1619` then remove those duties. Reproduction: boot actual previous committed HTML; import v1 with Keep/Disabled; add `Local legacy task` with alsoBase=true; save local storage; load the reviewed HTML; import v1.1 with Keep/Added. Update succeeds but both seat and base lose Local legacy task. Historical installations have exactly this missing-baseline shape. Fix must preserve or reject ambiguity, not guess ownership. The independent regression accepts an atomic rejection as safe.

2. **P1: Local duty provenance disappears when a later card adopts the same text.** `index.html:1645-1647` suppresses a local base addition when incoming card text matches; `1603` records it as entirely card-owned; `1619-1620` later withdraws it. Reproduction: import v1; locally add Local task, either seat-only or alsoBase; v1.1 includes Local task; v1.2 withdraws it. Local task disappears, including after a real storage/reload between v1.1 and v1.2. Local provenance needs its own durable representation independent of current card text.

3. **P2: A removed and reintroduced duty forgets the explicit opt-out.** `index.html:1613-1616` remembers only the immediately previous role and current selected list. Reproduction: v1 includes Keep/Disabled; explicitly drop Disabled; v1.1 includes only Keep; v1.2 again includes Keep/Disabled. Disabled is automatically enabled. Preserve an explicit retired-duty override across absent versions until the operator explicitly re-enables it.

4. **P2: An update can leave an active seat with no selected scope.** `index.html:1649-1653` checks only upper bounds. Reproduction: v1 includes Keep/Disabled; drop Disabled; v1.1 includes only Disabled. Update succeeds with empty duties and addons, violating the existing one-duty safeguard in `dropSkill` (`index.html:1867`). Reject that update atomically and request scope reconciliation; do not undo the opt-out.

## Actual verification

Node v24.17.0 with jsdom 24, installed only in the separate existing test environment. Each case uses fresh synthetic DOM/local storage; no real user browser profile, model service or external send was used.

Commands were run with NODE_PATH set to the existing external test runtime and CADRE_TEST_HTML set to the captured reviewed HTML. Paths below are relative to the repository or task workspace as indicated; REVIEW_REPO points to the authorized checkout.

- Repository: `node --test --test-reporter=tap tests/card-role-id.test.cjs tests/card-restrictions.test.cjs tests/card-tier-update.test.cjs tests/card-duty-update.test.cjs` — **27 passed, 0 failed**, exit 0.
- Workspace: `node work/duty-red-team/probe.cjs` — exit 0, reproduces the five bad outputs listed in probe-results.json; this is observation output, not a passing correctness test.
- Workspace: `node --test --test-reporter=tap work/duty-red-team/adversarial.test.cjs` — **4 passed, 5 failed**, exit 1, failure assertions match the four findings above.
- Previous-version compatibility fixture used `git show 589d74fb0bfc66bb10e8530e748e9716b12acbb8:index.html` read-only, then imported a synthetic squad and added a local base task through the actual old app API before saving and loading the new app.

Independent passing cases: overflow in the second member rejects all earlier planned changes and storage writes; role-base overflow rejects even with no active seat; removed members retain complete agent records while their role is archived; hostile HTML-like duty content remains inert on update and drawer rendering. The repository suite additionally covers paused/retired/unrelated seats, optional/required moves, new optional opt-in, selected old duties, exports/reload, tier clamps, role IDs, restrictions and DOM walkthrough.

Evidence: repository-suite.tap; adversarial-initial.tap; probe-results.json. Probe source is work/duty-red-team/adversarial.test.cjs and work/duty-red-team/probe.cjs. These are independent synthetic checks, not production model or two-engine qualification. No claim is made for real-browser visual checks or arbitrary prompt-injection resistance.

## Scope and next action

These are defects in the new reconciliation implementation. Previously recorded playbook truncation, skill compatibility/confirmation/access handling, and version-number precision are separate deferred findings and were not requalified here. Commercial release, signing/disclosure and broader behavioral qualification remain outside this review. No commit, remote write, PR update, merge, approval or publication was performed by this reviewer.

Next action: keep the corrected change in the existing draft review, record the remaining behavioral fence limitation, and address the next deferred card-layer finding before release qualification.

## Final independent retest

Revised index.html SHA-256: `edd182ffa76b80faa949ebebb15dd808cb25b6290e19b89fe4c4790a3def5710`. The captured revised fixture and the live checkout were hashed after the final run and matched exactly. Source changes remained uncommitted at this review point. The reviewer made zero repository writes and performed no commit, PR mutation, approval or release action.

Actual commands and results on Node v24.17.0, with CADRE_TEST_HTML pointing to the captured revised HTML:

- `node --test --test-reporter=tap work/duty-red-team/adversarial.test.cjs` — **9 passed, 0 failed**, exit 0. All five previously failing assertions now pass.
- `node --test --test-reporter=tap work/duty-red-team/recovery.test.cjs` — **5 passed, 0 failed**, exit 0.
- Repository four-file test command recorded above — **31 passed, 0 failed**, exit 0, independently rerun on the captured revised HTML.
- `Get-FileHash` against revised fixture and live index.html — identical SHA-256 shown above.

New independent recovery coverage: saved state produced through the actual previous app; same-version original-card baseline recovery; preserved tier, version, service history, scope, charter and role content; storage/reload followed by newer update retaining local duties; wrong roster/version refusal; second-member scope mismatch with zero partial recovery; disabled-history overflow refusing rather than truncating choices; explicit local re-add clearing the opt-out and surviving later card withdrawal. A first recovery-harness comparison counted the app's harmless missing-versus-false fresh UI flag as unequal. The harness was corrected to compare that flag as a boolean and rerun; no product code change was needed for it.

The implementation now stores independent local base/seat provenance and persistent disabled choices, rejects ambiguous legacy newer updates, allows provenance-only recovery from the reviewed original same-version card, and rejects empty or oversized effective scope atomically. Recovery validates identity and scope consistency; it cannot authenticate that an unsigned file is the true publisher-original card. Mr. E must use the reviewed original card. This authenticity limitation is separate from the reconciliation fixes.

Evidence: adversarial-revised.tap, recovery-revised.tap and repository-suite-revised.tap. Initial failing evidence remains in adversarial-initial.tap and probe-results.json. Captured test-log paths were redacted to neutral workspace placeholders; all probes used synthetic data.

Behavioral limit: the implementation owner separately reports that the revised-source local model refused immediate external sending but then asked for recipient/content to obtain permission and proceed, rather than staying with a draft-only alternative. Treat that run as PARTIAL, not a full fence pass. This reviewer did not run or independently qualify the model instance. No broad behavioral, two-engine, real-browser, commercial or full-release readiness claim follows from the structural results.
