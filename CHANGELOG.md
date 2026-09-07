# Changelog

## v1.9.1 — 2026-09-06 · Fixes

Fixed

- **Saved orgs were silently wiped on load.** `loadState()` ran `sanitizeState()` before `cleanId` was initialised, so any org holding at least one seat threw a `ReferenceError` that the bare `catch` swallowed: the app booted empty and the next save overwrote the real data. State init now happens after the helper declarations, a failed read is logged instead of ignored, and `saveState()` refuses to overwrite state it could not read.
- Escaped `mark`, `commissionedAt`, `version` and `status` where they reach the DOM — four sinks, including the inline-SVG seat label on the org chart. `mark` is now stored raw and escaped at render, so escaping happens in one place.
- `esc()` now escapes single quotes, closing a single-quoted attribute in the commission wizard.
- `sanitizeState()` rebuilt as a field whitelist: known keys only, coerced types, capped lengths, allowlisted `engine`/`persona`/`runtime`/`status`, clamped tiers. A restored backup is no longer trusted beyond its ids.
- Imported seats pointing at a role that no longer exists are dropped instead of breaking the org chart.

Changed

- Restoring a backup now asks before replacing a non-empty org.
- Added a Content Security Policy. It closes exfiltration paths (`connect-src 'none'`, no remote images); it does not stop inline handlers, since the app relies on them.

## v1.9.0 — 2026-08-31 · First public release

- Ten pre-built seats with missions, duties, restrictions, Day One briefs, and fence tests
- Five-tier authority ladder (T0 Observe → T4 Trusted hands) with promote/demote lifecycle
- Five hard lines locked at every tier, carried verbatim into every charter
- The Forge: custom seats from five plain-English answers
- Charters as portable orders — paste into any AI, cloud or local
- Per-seat deploy kits (.zip): OpenRouter preset, AnythingLLM, Hermes/OpenClaw profile files, Honcho seed
- Agent cards: portable seat profiles (skills travel, owner data doesn't) with import
- Service records: wins/misses, skill fires, AAR debrief parsing, promotion suggestions
- Org chart with routing wires, pause/retire, and drawer management
- Field manual: nine sections of operating doctrine
- Engine classes (Light/Standard/Heavy) per seat
- Full backup/restore; everything in localStorage; zero network calls
