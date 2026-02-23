# gh-review-comment

A [gh](https://cli.github.com/) extension for managing GitHub pull request review comments.

<details>
<summary>Motivation</summary>

The `gh` CLI does not provide built-in subcommands for managing pull request review comments. To reply to a comment or resolve a thread, you have to use `gh api` directly:

```sh
# Reply to a review comment
gh api -X POST /repos/OWNER/REPO/pulls/PR/comments/COMMENT_ID/replies -f body="..."

# Resolve a review thread (GraphQL)
gh api graphql -f query='mutation { resolveReviewThread(...) { ... } }'
```

This extension wraps these operations into simple commands.

</details>

## Installation

```sh
gh extension install p-chan/gh-review-comment
```

## Usage

List review threads on the current PR, reply to a comment, then resolve the thread.

```sh
# List review threads
gh review-comment list

# Reply to a comment
gh review-comment reply 123456789 -b "Fixed!"

# Resolve the thread
gh review-comment resolve PRRT_xxxxxxxxxx
```

## Commands

### `list`

List review comments on a pull request.

```sh
gh review-comment list [<pr>] [flags]
```

**Arguments**

| Argument | Description                                                                 |
| :------- | :-------------------------------------------------------------------------- |
| `<pr>`   | Pull request number (defaults to the PR associated with the current branch) |

**Flags**

| Flag           | Description                                             |
| :------------- | :------------------------------------------------------ |
| `-R`, `--repo` | Select another repository using the `OWNER/REPO` format |
| `--json`       | Output raw JSON                                         |
| `--resolved`   | Show only resolved threads                              |
| `--unresolved` | Show only unresolved threads                            |

### `reply`

Reply to a review comment.

```sh
gh review-comment reply <commentId> [flags]
```

**Arguments**

| Argument      | Description                          |
| :------------ | :----------------------------------- |
| `<commentId>` | Review comment database ID (numeric) |

**Flags**

| Flag           | Description                                             |
| :------------- | :------------------------------------------------------ |
| `-b`, `--body` | Reply body text (required)                              |
| `-R`, `--repo` | Select another repository using the `OWNER/REPO` format |

### `resolve`

Resolve a review thread.

```sh
gh review-comment resolve <threadId>
```

**Arguments**

| Argument     | Description                            |
| :----------- | :------------------------------------- |
| `<threadId>` | Review thread ID (starts with `PRRT_`) |

### `unresolve`

Unresolve a review thread.

```sh
gh review-comment unresolve <threadId>
```

**Arguments**

| Argument     | Description                            |
| :----------- | :------------------------------------- |
| `<threadId>` | Review thread ID (starts with `PRRT_`) |

## Development

When adding or changing commands, follow gh's interface conventions.

```sh
# Run
bun run dev

# Build
bun run build
```
