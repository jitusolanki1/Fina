import { Octokit } from "@octokit/rest";

export function octokitForToken(token) {
  return new Octokit({ auth: token });
}

/**
 * Create repo if not exists in user's account
 * @param {Octokit} octokit
 * @param {string} repoName
 */
export async function ensureRepoExists(octokit, repoName) {
  // Get user
  const { data: user } = await octokit.users.getAuthenticated();
  const owner = user.login;

  // Check if repo exists
  try {
    await octokit.repos.get({ owner, repo: repoName });
    return { owner, repo: repoName, existed: true };
  } catch (err) {
    // Not found -> create
    const res = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      private: true,
      description: "Fina auto daily summaries",
      auto_init: true // create initial commit with README
    });
    return { owner: res.data.owner.login, repo: res.data.name, existed: false };
  }
}

/**
 * Create or update file in repo path
 * @param {Octokit} octokit
 * @param {string} owner
 * @param {string} repo
 * @param {string} path - e.g. "05-12-2025/jitu.xlsx"
 * @param {Buffer|string} contentBuffer
 * @param {string} commitMessage
 */
export async function createOrUpdateFile(octokit, owner, repo, path, contentBuffer, commitMessage) {
  const contentBase64 = Buffer.from(contentBuffer).toString("base64");
  // check existing file to get sha
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    const sha = data.sha;
    const res = await octokit.repos.createOrUpdateFileContents({
      owner, repo, path, message: commitMessage, content: contentBase64, sha
    });
    return res.data;
  } catch (err) {
    // if 404 -> create new
    if (err.status === 404) {
      const res = await octokit.repos.createOrUpdateFileContents({
        owner, repo, path, message: commitMessage, content: contentBase64
      });
      return res.data;
    }
    throw err;
  }
}
