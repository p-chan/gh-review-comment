import { cli, define } from 'gunshi'
import pkg from './package.json'

const REVIEW_THREADS_QUERY = `
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            comments(first: 100) {
              nodes {
                id
                body
                path
                line
                originalLine
                author {
                  login
                }
                createdAt
                url
              }
            }
          }
        }
      }
    }
  }
`

type ReviewThreadComment = {
  id: string
  body: string
  path: string
  line: number | null
  originalLine: number | null
  author: { login: string }
  createdAt: string
  url: string
}

type ReviewThread = {
  id: string
  isResolved: boolean
  comments: { nodes: ReviewThreadComment[] }
}

type GraphQLResponse = {
  data: {
    repository: {
      pullRequest: {
        reviewThreads: { nodes: ReviewThread[] }
      }
    }
  }
}

const listCommand = define({
  name: 'list',
  description: 'List review comments on a pull request',
  args: {
    pr: {
      type: 'positional',
      description: 'Pull request number',
    },
    repo: {
      type: 'string',
      short: 'R',
      description: 'Select another repository using the [HOST/]OWNER/REPO format',
    },
    json: {
      type: 'boolean',
      description: 'Output JSON',
    },
  },
  run: async (ctx) => {
    const { pr, repo, json } = ctx.values

    let repoFullName = repo
    if (!repoFullName) {
      const result = Bun.spawnSync(['gh', 'repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'])
      if (result.exitCode !== 0) {
        console.error(new TextDecoder().decode(result.stderr).trim())
        process.exit(1)
      }
      repoFullName = new TextDecoder().decode(result.stdout).trim()
    }

    let prNumber = pr
    if (!prNumber) {
      const result = Bun.spawnSync(['gh', 'pr', 'view', '--json', 'number', '-q', '.number'])
      if (result.exitCode !== 0) {
        console.error(new TextDecoder().decode(result.stderr).trim())
        process.exit(1)
      }
      prNumber = new TextDecoder().decode(result.stdout).trim()
    }

    const parts = repoFullName.split('/').filter(Boolean)
    if (parts.length < 2) {
      console.error(`Invalid repository format "${repoFullName}". Expected "OWNER/REPO" or "HOST/OWNER/REPO".`)
      process.exit(1)
    }
    const owner = parts[parts.length - 2]
    const repoName = parts[parts.length - 1]

    const result = Bun.spawnSync([
      'gh', 'api', 'graphql',
      '-f', `query=${REVIEW_THREADS_QUERY}`,
      '-f', `owner=${owner}`,
      '-f', `repo=${repoName}`,
      '-F', `pr=${prNumber}`,
    ])
    if (result.exitCode !== 0) {
      console.error(new TextDecoder().decode(result.stderr).trim())
      process.exit(1)
    }

    const raw = new TextDecoder().decode(result.stdout)

    if (json) {
      console.log(raw)
      return
    }

    const response: GraphQLResponse = JSON.parse(raw)
    const threads = response.data.repository.pullRequest.reviewThreads.nodes

    if (threads.length === 0) {
      console.log('No review comments found.')
      return
    }

    for (const thread of threads) {
      const status = thread.isResolved ? 'resolved' : 'unresolved'
      console.log(`[${thread.id}] ${status}`)

      for (const comment of thread.comments.nodes) {
        const line = comment.line ?? comment.originalLine
        const location = line ? `${comment.path}:${line}` : comment.path
        console.log(`  [${comment.id}] ${location} — ${comment.author.login}`)
        console.log(`  ${comment.body}`)
        console.log(`  ${comment.url}`)
      }

      console.log()
    }
  },
})

const entryCommand = define({
  name: pkg.name,
  description: 'GitHub review comment management tool',
  run: () => {},
})

await cli(process.argv.slice(2), entryCommand, {
  name: pkg.name,
  version: pkg.version,
  subCommands: {
    list: listCommand,
  },
})
