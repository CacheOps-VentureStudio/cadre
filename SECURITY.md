# Security Policy

## Our security model

CADRE is a single, dependency-free `index.html` that runs entirely in your
browser. Its core security promises are:

- **No network calls.** The app makes no outbound requests. Nothing you type,
  generate, or import ever leaves your machine.
- **No accounts, no server, no telemetry.** There is no backend to breach and
  no analytics collecting your data.
- **Local-only state.** Your organization lives in `localStorage` under a
  single key. Backups are files you export and control.

You can verify all of the above with **View Source** — the entire product is
the one file in this repository.

## Threat model

Because CADRE is local-first, the realistic risks are:

- A malicious or tampered copy of `index.html` (always download from the
  canonical source or this repository).
- A supplied AI backend (Claude, ChatGPT, a local model, etc.) mishandling a
  charter — this is outside CADRE's control, which is why every seat defaults
  to low authority and ships with a refusal ("fence") test.
- Browser extensions or a compromised host reading `localStorage`.

## Supported versions

Only the latest released version receives security fixes.

| Version | Supported |
| ------- | --------- |
| Latest  | ✅         |
| Older   | ❌         |

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

- Use GitHub's **Report a vulnerability** feature under this repository's
  **Security** tab (Privately report a vulnerability), **or**
- Contact the maintainer privately via the address listed on the
  organization/owner profile.

Please include: a description of the issue, steps to reproduce, the affected
version/commit, and any suggested remediation.

## Response expectations

- Acknowledgement of your report as soon as reasonably possible.
- An assessment and, where confirmed, a fix in a subsequent release.
- Credit for the report if you would like it (optional).

Thank you for helping keep CADRE trustworthy.
