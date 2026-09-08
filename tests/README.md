# Card role-ID regression tests

The app remains one dependency-free HTML file. These tests use jsdom 24 only in a separate development/test environment; no test dependency ships with the app.

PowerShell, from the repository root:

~~~powershell
$testRuntime = Join-Path $env:TEMP 'cadre-dom-tests'
npm install --prefix $testRuntime --no-save --ignore-scripts jsdom@24
$env:NODE_PATH = Join-Path $testRuntime 'node_modules'
node --test tests/card-role-id.test.cjs
~~~

The suite creates isolated synthetic DOM and local-storage instances. It never opens the real browser profile or sends network requests. CADRE_TEST_HTML may point at an older HTML fixture to demonstrate the collision before the fix.

Coverage: the exact colliding SKU/member pair, independent updates, 495 valid identifier length/content combinations, maximum-length IDs, preserved seat identity/settings/history, legacy backup/load migration and idempotence, ambiguous/corrupt snapshot refusal, preflight with no partial changes, Founders/lead lookup, and the three-step lead walkthrough.

Identity format: p + one hexadecimal digit encoding cleaned SKU length + cleaned SKU + member key. Valid SKU lengths are 4–14 after removing the single fixed-position hyphen; valid member keys are 2–16 characters. The complete ID stays within 32 alphanumeric characters with no truncation. The length prefix uniquely determines the SKU/key boundary.

Intact legacy snapshots migrate in memory through sanitizeState, including role IDs, agent references and squad members. Existing normal save/restore persists the migrated state. The migration does not alter the supplied snapshot. Ambiguous ownership or occupied migration targets throw; loadState keeps the original stored bytes and saveState refuses to overwrite them. Already overwritten role content cannot be reconstructed: restore an intact backup.

The other v2.0.0 review findings remain open. These tests do not qualify the complete release, prove arbitrary model behavior, or substitute for real-browser visual checks.

## Verification — 2026-09-08

Base commit: 41b4ccb0c996deaf0c99f7c5f0fe8d0edf102740.
Fixed index.html SHA-256: 11e463ad08e1e819cb3b7ca098bd5d9001419d6c2c7e6315a8b9cc64fe8de483.

- Exact collision regression against the original HTML: exit 1 (expected failure).
- node --test tests/card-role-id.test.cjs: 11/11 passed on Node 24.17.0 and Node 20.20.0.
- Includes 495 valid ID combinations, free/retired seat preservation, intact legacy migration, ambiguous-storage refusal without overwrites, independent updates and the full three-step DOM walkthrough.
- git diff --check: passed.
- Local text-only Day One/refusal check attempted with qwen3.5:4b; request timed out at 60 seconds. No model refusal pass claimed. Real-browser visual verification and the original 61/19 suites were not run for this fix.
- This focused fix belongs to the existing v2.0.0 draft PR. Human review and promotion remain required; no merge or release is authorized. Remaining review findings stay open.
