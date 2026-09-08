# Card-layer regression tests

The app remains one dependency-free HTML file. These tests use jsdom 24 only in a separate development/test environment; no test dependency ships with the app.

PowerShell, from the repository root:

~~~powershell
$testRuntime = Join-Path $env:TEMP 'cadre-dom-tests'
npm install --prefix $testRuntime --no-save --ignore-scripts jsdom@24
$env:NODE_PATH = Join-Path $testRuntime 'node_modules'
node --test tests/card-role-id.test.cjs tests/card-restrictions.test.cjs tests/card-tier-update.test.cjs
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


## Update tier-ceiling verification — 2026-09-08

Base commit: 409f0c0dfc7fa1791e09168b51f714007513dee8.
Current index.html SHA-256: a0b2c47256622ac0c24a3b8a76a295e42c5c0542a86e94e0fbd24df3e47c3a8f.

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

Next action: reconcile active duty scope with updated squad cards and add a regression for removed and newly added duties.
