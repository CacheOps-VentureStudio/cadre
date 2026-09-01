# Contributing to CADRE

Thanks for looking under the hood. Ground rules:

1. **One file, forever.** CADRE is a single `index.html` with zero dependencies, zero build step, and zero network calls. PRs that add a bundler, a framework, a CDN link, or telemetry will be declined regardless of merit.
2. **Local-first is the contract.** Nothing may leave the user's machine. Anything that phones home breaks the product's core promise.
3. **Open an issue before large features.** Small fixes (bugs, typos, accessibility) — just PR them.
4. **Doctrine changes are content changes.** Edits to seats, tiers, hard lines, or the field manual should argue from how agent systems actually fail, not from taste.
5. **Test the fences.** If your change touches charter generation, run at least one seat's walkthrough end-to-end, including the refusal test.

By contributing you agree your contributions are licensed under the repository's MIT license.
