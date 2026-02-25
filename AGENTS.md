# AGENTS.md

## Overview

`gh-review-comment` is a GitHub CLI extension for managing pull request review comments.

### Commands

| Command                                         | Description                 |
| :---------------------------------------------- | :-------------------------- |
| `gh review-comment list`                        | List review threads on a PR |
| `gh review-comment reply <commentId> -b <body>` | Reply to a review comment   |
| `gh review-comment resolve <threadId>`          | Resolve a review thread     |
| `gh review-comment unresolve <threadId>`        | Unresolve a review thread   |

## Tech Stack

- Runtime / Package manager: **Bun**
- CLI framework: **Gunshi**
- Language: **TypeScript**
- Formatter: **oxfmt**
- Linter: **oxlint**

## Project Structure

- `index.ts` — single entrypoint containing all commands
- `package.json` — version is imported in `index.ts` via `import pkg from './package.json'`

## Development

```bash
bun install        # install dependencies
bun run dev        # run locally
bun run build      # compile to dist/gh-review-comment
bun run fmt        # format code
bun run fmt:check  # check formatting
bun run lint       # lint code
bun run lint:fix   # lint and auto-fix
```

## CLI Development

When creating or modifying CLI commands, use the `use-gunshi-cli` skill.

## Git / GitHub

- Branch strategy: always create a feature branch; never commit directly to `main`
- Commit style: Conventional Commits (English)
- Merge strategy: Squash only

### Before Committing

Verify the following commands succeed:

```bash
bun run build
bun run fmt:check
bun run lint
```
