# Contributing

Thanks for contributing to Sadrazam.

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

## Release notes

- version changes go through `package.json` and `CHANGELOG.md`
- tags use the `v*` format
- tag pushes trigger npm publish through GitHub Actions

## Scope

Please keep changes focused. If you touch docs, update the relevant README or docs page in the same PR.
