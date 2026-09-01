# CADRE

**Commission your AI staff the way you'd hire one: defined roles, limited authority, written orders.**

CADRE is a single-file, local-first app for building a small staff of AI agents — a Chief of Staff plus specialists — each with a written **charter**: portable orders you paste into any AI. Claude, ChatGPT, Gemini, a local model on Ollama or LM Studio, OpenRouter, AnythingLLM, or a Hermes/OpenClaw-style agent app. The charter is the product; the AI underneath is interchangeable.

No accounts. No server. No build step. No network calls. The whole product is one HTML file, and your organization lives in your browser's local storage.

**Live app:** `https://YOUR-USERNAME.github.io/cadre/` *(set after enabling GitHub Pages — see setup)*

---

## Why

Most people bolt AI onto their life one over-privileged chat at a time, then wonder why it sent the wrong thing, forgot everything, or drifted. The fix isn't a better prompt — it's org design: one seat per job, least privilege by default, promotion on evidence, and five hard lines that never move. CADRE turns that doctrine into paperwork you can actually keep.

## Quick start

1. Open the live app — or download `index.html` and double-click it. That's the install.
2. Name your Principal (a handle is fine).
3. Commission the **Chief of Staff**, then one specialist aimed at your worst weekly pain.
4. For each seat: copy the charter into the AI where it will live, send the Day One brief, and run the **fence test** — a deliberate request to cross a hard line, which the agent must refuse before you trust it with anything real.

## The system

**Ten pre-built seats.** Chief of Staff, Email Admin, Network Admin, Business Brain, Bookkeeper, Scheduler, Researcher, Content Writer, Vendor Watch, Study Coach. Each ships with a mission, duties, standing restrictions, a Day One brief, and its own fence test. The **Forge** builds custom seats from five plain-English answers.

**Five authority tiers (T0–T4).** Observe → Draft → Approve-to-act → Standing orders → Trusted hands. Every seat defaults low. Promotion is earned on the record; demotion is free and instant.

**Five hard lines, locked at every tier.** Spend money. Delete data. Send messages as you. Publish publicly. Change security settings. Never autonomous — each instance needs your explicit, per-action approval, forever.

**Engine classes.** Light / Standard / Heavy — which weight of model each seat actually deserves, so your vendor tracker isn't idling on a frontier model.

**Service records.** Wins, misses, skill fires, and AAR debrief parsing per seat — plus promotion, demotion, and retire-this-skill suggestions built from the record, not vibes.

**Deploy kits & agent cards.** Per-seat `.zip` with ready folders for OpenRouter presets, AnythingLLM, and Hermes/OpenClaw profiles (SOUL.md / USER.md / AGENTS.md), plus an optional Honcho memory seed. Agent cards make seats portable between CADREs: skills and personality travel, owner data doesn't.

**Field manual.** The nine-section operating doctrine behind every default — orchestrator-and-spokes, least privilege, context discipline, the weekly ten minutes — drawn from how reliable multi-agent systems are actually run.

## Privacy

Everything runs client-side. State lives in `localStorage` under a single key; the Backup tab exports it to a file you keep. There is no telemetry, no analytics, no account, and no request leaves your machine — verify with View Source, it's all right there.

## Self-hosting

It's one file. Drop `index.html` on any static host, or just keep it on a USB stick.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The one-file, zero-dependency constraint is a feature, not a limitation — PRs that respect it are welcome.

## License

[MIT](LICENSE). The CADRE name and the canonical hosted instance are not part of the license grant.
