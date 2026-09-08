# Changelog

## v2.0.0 — 2026-09-08 · Card layer: squads, Founders, skills

Post-review fixes (unreleased)

- Card library catalog corrected to the approved rosters: 85 seats across 16 squads (Data 7, Content 6, Design 6, Recruiter 5, Support 5, Email Admin 5); blurbs no longer name retired or never-filed seats (Guardrail Checker, screener, grader, Publisher-that-never-publishes). Metadata only: no loader, import, sanitize, or charter code changed. A regression test pins the SKUs, per-squad seat counts and replaced free seats, the 85 total, and the retired names.

- Reconcile squad duty updates while preserving local additions and opt-outs across versions. Reject empty/over-capacity scope atomically; retain history and paused/retired isolation. Legacy installations recover provenance from the original installed-version card before updating. Added 11 regressions and independently red-teamed multi-version and recovery cases.

- Squad updates now lower active seats to a reduced role ceiling without granting automatic promotions. Demotions record the old/new tiers and preset version; update notices request re-exporting affected charters. Four tests cover tier combinations, exports/reload, preserved records and the updated lead walkthrough.

- Squad/member role IDs now encode the SKU length, preventing different valid pairs from overwriting the same role. Intact legacy references migrate without losing seat identity or service history; ambiguous saved ownership fails closed without overwriting the original storage. Every incoming role is checked for existing ownership before any import mutation.
- Added a focused regression suite covering the exact collision, updates, identifier bounds, migration, ownership checks, Founders lookup, and the lead walkthrough. Other card-layer review findings remain open; this does not qualify v2.0.0 for release.
- Preserve complete restriction statements through squad and legacy seat imports, updates, exports and Forge creation. Removed automatic negation, updated the Forge prompt to request complete statements, and made the roster restriction label neutral. Five regression tests cover wording, persistence, defaults, sanitization and the walkthrough. Previously rewritten saved text is not automatically repaired.

Added

- **Squad cards.** A new card format (`cadre_card: 2`, kind `squad`) installs a whole squad of seats from one file: every member's role text (mission, Day One brief, fence test, duties, restrictions, access, engine, tiers) and its seat defaults (callsign, persona, tier, aim, standing procedures). Squads render in their own section under the roster with a procedurally drawn card face, member chips, and a **Commission squad** button that seats every member at once and runs one walkthrough — the lead's.
- **Founders cards** (kind `founders`) attach a number (1–100) to an installed squad; the badge appears on the card face and the service record. **Skill cards** (kind `skill`) land in a skill library; any active seat can slot one from its drawer.
- **Versioned updates in place.** Squad member roles get deterministic ids (`p<sku>m<key>`), so importing a newer card refreshes the role text, keeps every seated agent with its callsign, tier, and record, bumps their charter versions, logs a `preset-update` event, and archives members the new version dropped. Same or older versions are refused.
- **Setup chooser.** Opening the wizard on a free seat that an installed squad `replaces` asks: single seat (free) or the squad you own. Installing a squad over a seated free seat asks whether to hand the lane over (callsign, tier, and record move to the squad lead; the free seat retires) or keep both. Both can coexist — nothing collides.
- **Squad doctrine.** The Chief of Staff's routing table groups seats by squad and packets to the lead; lead charters carry a *Squad* section that permits assignment inside the squad only; the field manual's first section explains the one narrow exception to "no sideways chatter". The CoS restriction reads "assign work across squads" rather than "to other agents".
- **Import surface.** Backup & settings → Import a card accepts seat cards (v1), squad, Founders, and skill cards — pasted, dropped on the box, or chosen as a file (1 MB cap). Squad imports preview every seat and its tier before anything lands.
- Card face SVG export per squad. An in-app **Card library** screen (rail item VI): the sixteen-squad catalog as names, sizes, and one-line blurbs only, with Buy links built from `SHELF_URL` and an owned state for installed squads. Four routes point at it (first-run note, wizard standing-procedures hint on lanes with a squad, Squads empty state, field manual §10). Everything is inert while `SHELF_URL` is empty; the link is a plain `<a href>`, never a request.

Security

- Cards are hostile input: every field is re-shaped by `sanitizeCardV2()` (shape regexes for sku, member key, version, mark; caps on members, strings, and arrays); the emblem is the only geometry a card supplies and it is whitelisted to path-data characters, otherwise the card face falls back to the mark; unknown keys never reach state. `sanitizeState()` grew `squads`, `skills`, and the preset fields on roles, so backups round-trip and hostile backups still can't brick the app.
- Squad cards are the one deliberate widening of v1.9.2's import surface: their member **playbook and aim** are the publisher's and do import, header-demoted at import and fenced as PROCEDURE ONLY in the charter, capped at 8,000 / 140 characters. Seat cards (v1) still strip the buyer's own.
- No network primitives; CSP unchanged (`connect-src 'none'`).

Changed

- Custom-role `mark` may be two characters. Version is `2.0.0`. Service records show `card vX · preset vY` on squad seats.

## v1.9.2 — 2026-09-07 · Import hardening

Fixed

- A custom role with empty restrictions, duties, or best-for no longer sanitizes into a shape that crashes the roster; those fields get the same defaults the Forge already used.
- Init and backup restore wrap roster, field-manual, and org-chart renders so a render throw still leaves Backup (and Reset) reachable. The roster Never line no longer assumes a restriction exists.
- Imported free text is collapsed to a single line (newlines become spaces). Charter, trial-kit, and walkthrough interpolations run through `deHead()` so a pasted `##` cannot open a new section.
- An imported agent card’s new seat (and any new custom role) is passed through `sanitizeState()` like a backup. Incoming duties and addons are split on newlines the way skills are, then capped at 60 entries / 140 characters.
- Custom-role cards no longer copy mission, Day One, or fence-test text from the file. Imports get the template mission, Day One brief, and fence test. Title, function, duties, restrictions, access, engine, and default tier still come from the card.
- Reset clears the failed-load flag after wiping localStorage, so a new org can save.
- Imported cards never bring standing procedures or aim into the charter; the receiving Principal writes their own.
- Principal name and Hermes USER.md text can no longer open a Markdown section.

Changed

- Importing an agent card (and prefilling the Forge from a paste) shows a preview modal first: role title, the tier that will apply, and every duty, addon, restriction, and access line as they will land. Commissioning or filling the form happens only on Import.
- Agent cards omit `playbook` and `aim` unless the drawer checkbox “include my standing procedures and aim (owner data)” is ticked. The card header says so when they are included. Owner data does not travel by default.
- Version is `1.9.2`. Copy says ten pre-built seats.

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
