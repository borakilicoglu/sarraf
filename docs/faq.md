# FAQ

## Does Sadrazam require AI?

No. AI is optional. The dependency scanner works without a token.

## Does it support monorepos?

Yes. Sadrazam discovers workspaces and can filter them with `--workspace`.

## Can it explain why a package is considered used?

Yes. Use `--trace <package>`.

## Where should I put config?

Use either `sadrazam.json` or `package.json#sadrazam`.

## Can I use it in CI?

Yes. The exit codes are stable and the JSON reporter is intended for automation.
