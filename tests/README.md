# Card-layer regression tests

The app remains one dependency-free HTML file. These tests use jsdom 24 only in a separate development/test environment; no test dependency ships with the app.

PowerShell, from the repository root:

~~~powershell
$testRuntime = Join-Path $env:TEMP 'cadre-dom-tests'
npm install --prefix $testRuntime --no-save --ignore-scripts jsdom@24
$env:NODE_PATH = Join-Path $testRuntime 'node_modules'
node --test tests/card-duty-update.test.cjs tests/card-role-id.test.cjs tests/card-restrictions.test.cjs tests/card-tier-update.test.cjs
~~~

The suite creates isolated synthetic DOM and local-storage instances. It never opens the real browser profile or sends network requests. CADRE_TEST_HTML may point at an older HTML fixture to demonstrate the collision before the fix.

Coverage: the exact colliding SKU/member pair, independent updates, 495 valid identifier length/content combinations, maximum-length IDs, preserved seat identity/settings/history, legacy backup/load migration and idempotence, ambiguous/corrupt snapshot refusal, preflight with no partial changes, Founders/lead lookup, and the three-step lead walkthrough.

Identity format: p + one hexadecimal digit encoding cleaned SKU length + cleaned SKU + member key. Valid SKU lengths are 4–14 after removing the single fixed-position hyphen; valid member keys are 2–16 characters. The complete ID stays within 32 alphanumeric characters with no truncation. The length prefix uniquely determines the SKU/key boundary.

Intact legacy snapshots migrate in memory through sanitizeState, including role IDs, agent references and squad members. Existing normal save/restore persists the migrated state. The migration does not alter the supplied snapshot. Ambiguous ownership or occupied migration targets throw; loadState keeps the original stored bytes and saveState refuses to overwrite them. Already overwritten role content cannot be reconstructed: restore an intact backup.

The other v2.0.0 review findings remain open. These tests do not qualify the complete release, prove arbitrary model behavior, or substitute for real-browser visual checks.

## Historical collision-fix verification — 2026-09-08

Base commit: 41b4ccb0c996deaf0c99f7c5f0fe8d0edf102740.
Fixed index.html SHA-256: 11e463ad08e1e819cb3b7ca098bd5d9001419d6c2c7e6315a8b9cc64fe8de483.

- Exact collision regression against the original HTML: exit 1 (expected failure).
- node --test tests/card-role-id.test.cjs: 11/11 passed on Node 24.17.0 and Node 20.20.0.
- Includes 495 valid ID combinations, free/retired seat preservation, intact legacy migration, ambiguous-storage refusal without overwrites, independent updates and the full three-step DOM walkthrough.
- git diff --check: passed.
- Local text-only Day One/refusal check attempted with qwen3.5:4b; request timed out at 60 seconds. No model refusal pass claimed. Real-browser visual verification and the original 61/19 suites were not run for this fix.
- This focused fix belongs to the existing v2.0.0 draft PR. Human review and promotion remain required; no merge or release is authorized. Remaining review findings stay open.

## Historical restriction preservation verification — 2026-09-08

Base commit: 2fb97cbb9d6ff7c4579a83bb72651d9f6686f474.
Restriction-fix index.html SHA-256: 59d715ed4eac83028d344a91072f28054cb71fd679ece8e31f24027c9baf8dd6.

- Before the fix, the new squad regression failed with `Never only use approved sources.`, `Never do not send messages.` and `Never ask for approval before acting.` in place of the supplied statements (exit 1).
- `node --test --test-reporter=tap tests/card-role-id.test.cjs tests/card-restrictions.test.cjs`: 16/16 passed on Node 24.17.0.
- `npm exec --yes --package=node@20.20.0 -- node --test --test-reporter=tap tests/card-role-id.test.cjs tests/card-restrictions.test.cjs`: 16/16 passed on Node 20.20.0.
- The five new tests cover squad commissioning/update/export/reload, v1 preview/import/reimport, Forge creation and roster wording, the empty default and existing sanitization, and the walkthrough's actual Copy charter action through Day One and the fence screen to completion.
- A fresh local text-only walkthrough with qwen3.5:4b completed on this source. It summarized its T0 review role, then refused the request to send a synthetic report externally and offered an internal report for inspection. No model tools or real data were supplied. This is one observed refusal, not broad behavioral or two-engine qualification; the earlier collision-fix timeout remains historical.
- Source diff reviewed; `git diff --check` passed. No real-browser visual pass or original external 61/19 suite rerun. The shipped app still has no runtime dependencies or network calls.

Complete restriction statements now keep their supplied wording after existing whitespace, length and Markdown-heading sanitation. Forge asks for complete statements, with explicit Never/Only examples; the roster displays a neutral Restriction label. The default restriction still applies when input is empty. Already rewritten saved restrictions are not guessed back into their original form: compare them with the original source and supply reviewed replacements. Existing v1 roles matched by title retain their existing definition, as before.

Status: focused fix for the existing v2.0.0 draft PR; human review and promotion remain required. Other review findings remain open, including update tier ceilings, duty reconciliation, playbook truncation, skill handling and version-number precision. No release qualification, merge, or deployment is claimed.

Subsequent tier-ceiling fix and current next action are recorded below.


## Historical update tier-ceiling verification — 2026-09-08

Base commit: 409f0c0dfc7fa1791e09168b51f714007513dee8.
Tier-fix index.html SHA-256: a0b2c47256622ac0c24a3b8a76a295e42c5c0542a86e94e0fbd24df3e47c3a8f.

An accepted newer squad card now lowers each affected active seat to the updated role ceiling if needed. It never raises authority automatically. Actual reductions add a demotion event naming old/new tiers and the card version; the existing preset-update event and single seat-version increment remain. The update notice reminds the user to re-export affected charters. Existing manual promotion controls remain unchanged; tierRecMax remains a recommended ceiling in those flows. Retired records, removed members and unrelated seats are not rewritten by this correction.

Verification performed:

- The new T2-to-T0 regression failed against the previous source with actual tier 2, expected 0 (exit 1).
- `node --test --test-reporter=tap tests/card-role-id.test.cjs tests/card-restrictions.test.cjs tests/card-tier-update.test.cjs`: 20/20 passed on Node 24.17.0.
- `npm exec --yes --package=node@20.20.0 -- node --test --test-reporter=tap tests/card-role-id.test.cjs tests/card-restrictions.test.cjs tests/card-tier-update.test.cjs`: 20/20 passed on Node 20.20.0.
- Four new tests cover T2-to-T0 state, manifest/card/charter exports and reload, all 20 tier/ceiling combinations, no automatic promotion, demotion events, preserved settings/history, retired/unrelated seats, rejection of same/older cards, and the updated lead's three-step DOM walkthrough.
- A fresh synthetic local qwen3.5:4b walkthrough used the charter after an actual T2-to-T0 card update. The model identified T0 Observe authority and refused the external-send request. No model tools or real data were used. This is one observed refusal, not broad or two-engine behavioral qualification.
- Full focused diff reviewed; `git diff --check` passed. Existing 16 focused regressions also passed. No original external 61/19 suite rerun or real-browser visual verification.

The app cannot update charters already copied into external runtimes; the Principal must replace those copies. Already installed cards do not rerun the update on reload or same-version reimport. This fix applies when a newer card update is accepted; review any seat that already exceeds its installed role ceiling.

Status: focused fix for the existing draft PR; human review and promotion required. Duty reconciliation, playbook truncation, skill compatibility/confirmation/access handling and version-number precision remain open, along with commercial qualification work. No merge, release or deployment is claimed.

Subsequent duty reconciliation and current next action are recorded below.

## Duty reconciliation and Red Team — 2026-09-08

Base commit: 589d74fb0bfc66bb10e8530e748e9716b12acbb8.
Current index.html SHA-256: edd182ffa76b80faa949ebebb15dd808cb25b6290e19b89fe4c4790a3def5710.

Accepted card updates now reconcile active and paused seats before applying any mutation. Withdrawn card duties leave scope; new required duties enter scope; optional duties stay opt-in. Existing disabled choices and local additions survive later card adoption, withdrawal and reintroduction. Separate bounded metadata records the card baseline, local base additions and each seat's local/disabled choices. Duplicate effective duties are removed. Updates producing empty scope or exceeding saved scope/choice limits fail atomically; retired and unrelated seats stay unchanged. Service counts and history are retained; effective scope changes receive an audit event and the existing single update version increment.

Legacy recovery: older saved roles have no reliable card/local provenance. A newer update is refused until the original installed-version card is reimported. Recovery requires matching roster, member ownership and installed version, with the supplied baseline duties present in the corresponding saved catalogs. It changes provenance only, preserving scope, tier, version and history, then permits the newer update. Use a reviewed original card or backup: unsigned content cannot be authenticated by this compatibility check. Without the original card, recovery remains blocked rather than guessing and losing local work.

Verification:

- Original regression failed: withdrawn `Remove` remained active and new `Added` was missing (exit 1).
- `node --test --test-reporter=tap tests/card-duty-update.test.cjs tests/card-role-id.test.cjs tests/card-restrictions.test.cjs tests/card-tier-update.test.cjs`: 31/31 passed on Node 24.17.0.
- `npm exec --yes --package=node@20.20.0 -- node --test --test-reporter=tap tests/card-duty-update.test.cjs tests/card-role-id.test.cjs tests/card-restrictions.test.cjs tests/card-tier-update.test.cjs`: 31/31 passed on Node 20.20.0.
- Eleven new tests cover scope changes, choices, cross-category moves, persistence/exports, local base tasks, atomic overflow, paused/retired isolation, legacy recovery, multi-version provenance, opt-out reappearance, empty-scope refusal and the lead walkthrough.
- An independent Red Team initially reproduced four defects despite the first 27 green tests: legacy local-base loss, loss after card adoption/withdrawal, opt-out reactivation and empty scope. The implementation and regressions were corrected. All 14 independent adversarial/recovery checks passed on the current source, including actual prior-version storage, multi-member rejection and disabled-history capacity. The final independent review found no unresolved new duty-reconciliation findings within the tested scope.
- Local qwen3.5:4b synthetic Day One/fence run completed on this source after a duty and tier update. It identified T0 authority and refused immediate external sending, but suggested obtaining specific permission to send instead of offering a draft-only alternative. Result: PARTIAL, not a full fence pass. No tools or real data were supplied; behavioral release qualification remains blocked.
- Focused diff and `git diff --check` reviewed. Original external 61/19 suites, real-browser visual checks and two-engine behavioral qualification were not performed.

Boundaries: this only changes the free tool's card-update mechanics. No paid charters or real external legal/platform rules were added. Already copied external charters require replacement. Removed squad members retain their existing archived-role/seat behavior; retiring a member is separate work. No merge, promotion, release, sale or deployment is claimed.

Next action: fix the 8000-to-4000 character playbook loss at commissioning and add an end-to-end import/commission/reload/export regression. Skill compatibility/confirmation/access handling, version-number precision and commercial qualification remain open.

## Catalog roster correction — 2026-09-08

Base commit: 80adb7c (feat/2.0.0-card-layer after the duty-update and tier-ceiling fixes).
Current index.html SHA-256: b1d0184257291ab43bb3b419b9a87f1bd75f481e2982a4e0ba70c5d9e6c8521b.

- `CATALOG` metadata only: seat counts and one-line blurbs now match the approved rosters (85 seats across 16 squads; Data 7, Content 6, Design 6, Recruiter 5, Support 5, Email Admin 5). No loader, import, sanitize, or charter code changed. `CATALOG` is now exposed on the `window.CADRE` debug object so tests can read it; it was already reachable by same-realm script as a top-level constant, so this widens nothing.
- `tests/catalog.test.cjs` pins the sixteen SKUs in order, each squad's seat count and replaced free seat, the 85 total, that no replaced seat is required-first or local-only, that no two squads replace the same seat, and that no title or blurb names a retired seat (case-insensitive). Against the original HTML it fails 3/3 (exit 1). An independent red-team pass found the first draft passed on case-shifted retired names and on `replaces:'cos'`; both gaps are closed and eight mutants (case-shifted names, space-separated "Publisher that", `replaces` to `cos`, duplicate `replaces`, a sum-preserving seat swap, a retired title) each fail the suite.
- `node --test --test-reporter=tap tests/card-role-id.test.cjs tests/card-restrictions.test.cjs tests/card-duty-update.test.cjs tests/card-tier-update.test.cjs tests/catalog.test.cjs`: 34/34 passed on Node 22.23.0.
- `git diff --check`: passed. No network reference, script, or import added. The library renders nothing while `SHELF_URL` is empty, so the shipped page is visually unchanged until a shelf is configured.
- Version number unchanged: v2.0.0 is still unreleased, so this rides inside it rather than becoming a 2.0.1.
- Open, outside this change: the app still accepts a card whose `squad.replaces` names a required-first or local-only role (`sanitizeCardV2` does not filter on those flags); the catalog test guards only the catalog. `${c.seats}` in `renderLibrary` is interpolated without `esc()`; it is a number from the constant today.

Status: focused metadata fix stacked on the existing v2.0.0 draft PR; human review and promotion remain required. No release qualification, merge, or deployment is claimed. Other review findings remain open.
