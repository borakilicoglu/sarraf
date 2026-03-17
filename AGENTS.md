# AGENTS.md

## Purpose

Sarraf is a dependency analysis CLI for JavaScript and TypeScript projects.

Priorities in this repository:

1. Keep dependency analysis correct.
2. Avoid false positives where possible.
3. Preserve CLI stability and predictable output.
4. Do not break non-AI mode when changing AI features.

## Core Rules

- The base scan must remain useful without AI.
- AI failures must never break the main scan report.
- `text` and `json` reporters must stay stable.
- Exit codes must remain predictable:
  - `0` = no findings
  - `1` = execution/config/runtime failure
  - `2` = findings present
- Config loading from `sarraf.json` and `package.json#sarraf` must continue to work.
- Smoke scenarios must keep passing before release-related changes.

## Project Areas

- `src/index.ts`: CLI entrypoint and option handling
- `src/scan.ts`: core dependency scanning flow
- `src/importParser.ts`: import/CommonJS parsing
- `src/scriptParser.ts`: package.json scripts analysis
- `src/sourceMapper.ts`: dist-to-src mapping
- `src/reporters.ts`: text/json output
- `src/aiClient.ts`: provider-backed AI summaries
- `src/config.ts`: config loading
- `src/findings.ts`: finding filtering and allowlist logic
- `src/workspaceFinder.ts`: monorepo/workspace discovery

## Required Verification

For meaningful code changes, run:

```bash
npm run typecheck
npm test
npm run smoke
```

If a change is small and one of these does not apply, state that explicitly in the final note.

## Commit Message Rules

Use prefixed commit messages.

Allowed prefixes:

- `feature:`
- `fix:`
- `docs:`
- `refactor:`
- `test:`
- `chore:`
- `release:`

Examples:

- `feature: add workspace trace output`
- `fix: handle AI auth failures gracefully`
- `docs: document exit codes`
- `release: prepare v0.1.0-alpha.1`

Do not use vague commit messages like:

- `update`
- `changes`
- `misc fixes`

## Release Tags

Use semver tags with pre-release suffixes while the project is not stable.

Expected tag format:

- `v0.1.0-alpha.1`
- `v0.1.0-alpha.2`
- `v0.1.0-beta.1`
- `v0.1.0`

Do not create a release tag unless:

- working tree is clean
- `npm run typecheck` passes
- `npm test` passes
- `npm run smoke` passes
- README examples are still valid
- changelog has been updated

## CHANGELOG

Maintain a root-level `CHANGELOG.md`.

Rules:

- Add an entry before creating a release tag.
- Keep entries newest-first.
- Group changes under version headings.
- Use short sections when relevant:
  - `Added`
  - `Changed`
  - `Fixed`

Example:

```md
# CHANGELOG

## v0.1.0-alpha.1

### Added
- Workspace-aware scanning
- JSON reporter

### Changed
- Improved CLI help output

### Fixed
- AI auth errors no longer break the base report
```

## Alpha Release Notes

Before the first alpha tag, review:

- `docs/ALPHA_CHECKLIST.md`

## Documentation Expectations

When features change behavior, update:

- `README.md`
- `CHANGELOG.md` for release-bound changes
- `docs/ALPHA_CHECKLIST.md` if alpha gates change

## Safety Notes

- Do not remove smoke fixtures unless replacing them with equal or better coverage.
- Do not silently change JSON output shape without documenting it.
- Do not introduce AI-only logic into the base scan path.
