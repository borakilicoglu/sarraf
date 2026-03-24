# Contributing

Thanks for contributing to Sadrazam.

## Core rules

- Keep changes focused. Avoid mixing unrelated refactors into the same PR.
- Do not silently change CLI behavior, reporter output, or config semantics without updating docs.
- Prefer deterministic analysis over aggressive guessing. Lower false positives are more important than feature breadth.
- Do not expand auto-fix behavior unless the change is clearly safe and reversible.
- If you add or change a finding type, update tests, docs, and changelog entries in the same PR.
- If you add a CLI flag, update `--help`, README usage examples, and docs.
- If you change JSON output, treat it as a contract change and document it.
- Keep README and docs aligned. Do not leave one ahead of the other.

## Development

Install dependencies:

```bash
npm install
```

Run checks before opening a PR:

```bash
npm run typecheck
npm test
npm run smoke
npm run docs:build
```

## Commit messages

Use the repository commit prefixes when possible:

- `feature:`
- `fix:`
- `docs:`
- `refactor:`
- `test:`
- `chore:`
- `release:`

## Testing expectations

- New features should include at least one CLI or fixture-based test.
- Bug fixes should add coverage for the failure case when practical.
- Changes that affect real-world scan behavior should be validated against representative project fixtures.
- Do not ship docs-only claims for features that are not covered by tests or smoke runs.

## Release notes

- Version changes go through `package.json` and `CHANGELOG.md`.
- Tags use the `v*` format.
- Tag pushes trigger npm publish through GitHub Actions.
- GitHub Releases should stay in sync with published tags.

## Scope

Please keep changes small, explicit, and reviewable. If you touch docs, update the relevant README or docs page in the same PR.
