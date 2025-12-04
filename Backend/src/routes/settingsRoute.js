import axios from "axios";
import path from "path";

export async function pushFileToGitHub({
  token,
  repo,
  branch = "main",
  filePath,
  fileContent,
  commitMessage
}) {
  try {
    const [owner, repoName] = repo.split("/");

    const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`;

    const encodedContent = Buffer.from(fileContent).toString("base64");

    // Check if file exists (we need "sha" to update)
    let sha = null;
    try {
      const res = await axios.get(url, {
        headers: { Authorization: `token ${token}` }
      });
      sha = res.data.sha;
    } catch (e) {
      sha = null;
    }

    const response = await axios.put(
      url,
      {
        message: commitMessage,
        content: encodedContent,
        branch,
        sha
      },
      {
        headers: { Authorization: `token ${token}` }
      }
    );

    return response.data;
  } catch (err) {
    console.error("GitHub push error:", err.response?.data || err.message);
    throw err;
  }
}
