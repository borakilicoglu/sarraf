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


## Can it find unused files and exports?

Yes. Sadrazam can report unreachable source files and unused exports in reachable local modules.

## Can I focus only on file-level findings?

Yes. Use `--include unused-files,unused-exports`.
