# gh-review-comment

## 0.2.0

### Minor Changes

- eefddc2: Add `--resolved` and `--unresolved` flags to the `list` subcommand to filter review threads by their resolution status.

## 0.1.0

### Minor Changes

- 9850eca: Add `list` subcommand for listing PR review comments
- a2dc5dc: Add `reply` subcommand for replying to PR review comments
- a026c89: Add `resolve` subcommand for resolving PR review threads
- 626795e: Add `unresolve` subcommand for unresolving PR review threads
- fa0bfaf: Remove `--pr` flag from `reply` subcommand; PR number is now auto-detected from comment details

### Patch Changes

- bd21a6f: Align `reply` subcommand output with gh CLI style
- 714e797: Pass `--repo` to `gh pr view` when resolving PR number in `reply` and `list` subcommands
- c3863a0: Switch `reply` subcommand from GraphQL to REST API
- eeb6290: Improve arg descriptions for consistency with GitHub UI
