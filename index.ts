import { cli, define } from "gunshi";
import pkg from "./package.json";

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
                databaseId
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
`;

type ReviewThreadComment = {
  id: string;
  databaseId: number;
  body: string;
  path: string;
  line: number | null;
  originalLine: number | null;
  author: { login: string };
  createdAt: string;
  url: string;
};

type ReviewThread = {
  id: string;
  isResolved: boolean;
  comments: { nodes: ReviewThreadComment[] };
};

type GraphQLResponse = {
  data: {
    repository: {
      pullRequest: {
        reviewThreads: { nodes: ReviewThread[] };
      } | null;
    } | null;
  };
};

type RestReplyResponse = {
  id: number;
  html_url: string;
  url: string;
};

const RESOLVE_MUTATION = `
  mutation($threadId: ID!) {
    resolveReviewThread(input: { threadId: $threadId }) {
      thread {
        id
        isResolved
      }
    }
  }
`;

type ResolveResponse = {
  data: {
    resolveReviewThread: {
      thread: {
        id: string;
        isResolved: boolean;
      };
    } | null;
  };
};

const UNRESOLVE_MUTATION = `
  mutation($threadId: ID!) {
    unresolveReviewThread(input: { threadId: $threadId }) {
      thread {
        id
        isResolved
      }
    }
  }
`;

type UnresolveResponse = {
  data: {
    unresolveReviewThread: {
      thread: {
        id: string;
        isResolved: boolean;
      };
    } | null;
  };
};

const replyCommand = define({
  name: "reply",
  description: "Reply to a review comment",
  args: {
    commentId: {
      type: "positional",
      description: "Review comment database ID (numeric)",
    },
    body: {
      type: "string",
      short: "b",
      description: "Reply body text",
    },
    repo: {
      type: "string",
      short: "R",
      description: "Select another repository using the OWNER/REPO format",
    },
  },
  run: async (ctx) => {
    const { commentId, body, repo } = ctx.values;

    if (!commentId) {
      console.error("Error: commentId is required");
      process.exit(1);
    }

    if (!body) {
      console.error("Error: --body is required");
      process.exit(1);
    }

    let repoFullName = repo;
    if (!repoFullName) {
      const repoResult = Bun.spawnSync([
        "gh",
        "repo",
        "view",
        "--json",
        "nameWithOwner",
        "-q",
        ".nameWithOwner",
      ]);
      if (repoResult.exitCode !== 0) {
        console.error(new TextDecoder().decode(repoResult.stderr).trim());
        process.exit(1);
      }
      repoFullName = new TextDecoder().decode(repoResult.stdout).trim();
    }

    const parts = repoFullName.split("/").filter(Boolean);
    if (parts.length < 2) {
      console.error(`Invalid repository format "${repoFullName}". Expected "OWNER/REPO".`);
      process.exit(1);
    }
    const owner = parts[parts.length - 2];
    const repoName = parts[parts.length - 1];

    const commentResult = Bun.spawnSync([
      "gh",
      "api",
      `/repos/${owner}/${repoName}/pulls/comments/${commentId}`,
      "-q",
      ".pull_request_url",
    ]);
    if (commentResult.exitCode !== 0) {
      console.error(new TextDecoder().decode(commentResult.stderr).trim());
      process.exit(1);
    }
    const pullRequestUrl = new TextDecoder().decode(commentResult.stdout).trim();
    const prNumber = pullRequestUrl.split("/").pop();

    const result = Bun.spawnSync([
      "gh",
      "api",
      "-X",
      "POST",
      `/repos/${owner}/${repoName}/pulls/${prNumber}/comments/${commentId}/replies`,
      "-f",
      `body=${body}`,
    ]);

    if (result.exitCode !== 0) {
      console.error(new TextDecoder().decode(result.stderr).trim());
      process.exit(1);
    }

    const response: RestReplyResponse = JSON.parse(new TextDecoder().decode(result.stdout));
    console.log(`✓ Replied to comment ${response.html_url}`);
  },
});

const resolveCommand = define({
  name: "resolve",
  description: "Resolve a review thread",
  args: {
    threadId: {
      type: "positional",
      description: "Review thread ID (starts with `PRRT_`)",
    },
  },
  run: async (ctx) => {
    const { threadId } = ctx.values;

    if (!threadId) {
      console.error("Error: threadId is required");
      process.exit(1);
    }

    const result = Bun.spawnSync([
      "gh",
      "api",
      "graphql",
      "-f",
      `query=${RESOLVE_MUTATION}`,
      "-f",
      `threadId=${threadId}`,
    ]);

    if (result.exitCode !== 0) {
      console.error(new TextDecoder().decode(result.stderr).trim());
      process.exit(1);
    }

    const response: ResolveResponse = JSON.parse(new TextDecoder().decode(result.stdout));
    const thread = response.data?.resolveReviewThread?.thread;
    if (!thread) {
      console.error("Failed to resolve thread.");
      process.exit(1);
    }

    console.log(`✓ Resolved review thread ${thread.id}`);
  },
});

const unresolveCommand = define({
  name: "unresolve",
  description: "Unresolve a review thread",
  args: {
    threadId: {
      type: "positional",
      description: "Review thread ID (starts with `PRRT_`)",
    },
  },
  run: async (ctx) => {
    const { threadId } = ctx.values;

    if (!threadId) {
      console.error("Error: threadId is required");
      process.exit(1);
    }

    const result = Bun.spawnSync([
      "gh",
      "api",
      "graphql",
      "-f",
      `query=${UNRESOLVE_MUTATION}`,
      "-f",
      `threadId=${threadId}`,
    ]);

    if (result.exitCode !== 0) {
      console.error(new TextDecoder().decode(result.stderr).trim());
      process.exit(1);
    }

    const response: UnresolveResponse = JSON.parse(new TextDecoder().decode(result.stdout));
    const thread = response.data?.unresolveReviewThread?.thread;
    if (!thread) {
      console.error("Failed to unresolve thread.");
      process.exit(1);
    }

    console.log(`✓ Unresolved review thread ${thread.id}`);
  },
});

const listCommand = define({
  name: "list",
  description: "List review comments on a pull request",
  args: {
    // TODO: Remove `multiple: true` once gunshi supports optional positional args.
    // https://github.com/kazupon/gunshi/issues/251
    pr: {
      type: "positional",
      multiple: true,
      description: "Pull request number",
    },
    repo: {
      type: "string",
      short: "R",
      description: "Select another repository using the OWNER/REPO format",
    },
    json: {
      type: "boolean",
      description: "Output raw JSON",
    },
    resolved: {
      type: "boolean",
      description: "Show only resolved threads",
    },
    unresolved: {
      type: "boolean",
      description: "Show only unresolved threads",
    },
  },
  run: async (ctx) => {
    const { pr: prValues, repo, json, resolved, unresolved } = ctx.values;

    if (Array.isArray(prValues) && prValues.length > 1) {
      console.error("Error: Only a single pull request number can be specified");
      process.exit(1);
    }

    const pr = prValues?.[0];

    if (resolved && unresolved) {
      console.error("Error: --resolved and --unresolved cannot be used together");
      process.exit(1);
    }

    let repoFullName = repo;
    if (!repoFullName) {
      const repoResult = Bun.spawnSync([
        "gh",
        "repo",
        "view",
        "--json",
        "nameWithOwner",
        "-q",
        ".nameWithOwner",
      ]);
      if (repoResult.exitCode !== 0) {
        console.error(new TextDecoder().decode(repoResult.stderr).trim());
        process.exit(1);
      }
      repoFullName = new TextDecoder().decode(repoResult.stdout).trim();
    }

    let prNumber = pr;
    if (!prNumber) {
      const prResult = Bun.spawnSync([
        "gh",
        "pr",
        "view",
        "--json",
        "number",
        "-q",
        ".number",
      ]);
      if (prResult.exitCode !== 0) {
        console.error(new TextDecoder().decode(prResult.stderr).trim());
        process.exit(1);
      }
      prNumber = new TextDecoder().decode(prResult.stdout).trim();
    }

    const parts = repoFullName.split("/").filter(Boolean);
    if (parts.length < 2) {
      console.error(`Invalid repository format "${repoFullName}". Expected "OWNER/REPO".`);
      process.exit(1);
    }
    const owner = parts[parts.length - 2];
    const repoName = parts[parts.length - 1];

    const graphqlResult = Bun.spawnSync([
      "gh",
      "api",
      "graphql",
      "-f",
      `query=${REVIEW_THREADS_QUERY}`,
      "-f",
      `owner=${owner}`,
      "-f",
      `repo=${repoName}`,
      "-F",
      `pr=${prNumber}`,
    ]);
    if (graphqlResult.exitCode !== 0) {
      console.error(new TextDecoder().decode(graphqlResult.stderr).trim());
      process.exit(1);
    }

    const raw = new TextDecoder().decode(graphqlResult.stdout);

    const response: GraphQLResponse = JSON.parse(raw);
    const pullRequest = response.data?.repository?.pullRequest;
    if (!pullRequest) {
      console.error(`Pull request #${prNumber} not found in ${repoFullName}.`);
      process.exit(1);
    }
    const allThreads = pullRequest.reviewThreads.nodes;

    let threads = allThreads;
    if (resolved) {
      threads = allThreads.filter((t) => t.isResolved);
    } else if (unresolved) {
      threads = allThreads.filter((t) => !t.isResolved);
    }

    if (json) {
      const filteredResponse: GraphQLResponse = {
        data: {
          repository: {
            pullRequest: {
              reviewThreads: { nodes: threads },
            },
          },
        },
      };
      console.log(JSON.stringify(filteredResponse));
      return;
    }

    if (threads.length === 0) {
      console.log("No review comments found.");
      return;
    }

    for (const thread of threads) {
      const status = thread.isResolved ? "resolved" : "unresolved";
      console.log(`[${thread.id}] ${status}`);

      for (const comment of thread.comments.nodes) {
        const line = comment.line ?? comment.originalLine;
        const location = line ? `${comment.path}:${line}` : comment.path;
        console.log(`  [${comment.databaseId}] ${location} — ${comment.author.login}`);
        console.log(`  ${comment.body}`);
        console.log(`  ${comment.url}`);
      }

      console.log();
    }
  },
});

const entryCommand = define({
  name: pkg.name,
  description: "GitHub review comment management tool",
  run: () => {},
});

await cli(process.argv.slice(2), entryCommand, {
  name: pkg.name,
  version: pkg.version,
  subCommands: {
    list: listCommand,
    reply: replyCommand,
    resolve: resolveCommand,
    unresolve: unresolveCommand,
  },
});
