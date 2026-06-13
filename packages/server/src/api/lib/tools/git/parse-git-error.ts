export function parseGitError(err: any): string {
  const msg = (err.stderr ?? err.stdout ?? err.message ?? "").toString().trim();

  if (msg.includes("not a git repository")) {
    return "Not a git repository. Run: git init";
  }
  if (msg.includes("Author identity unknown")) {
    return "Git user not configured.\nRun:\n  git config user.email 'you@example.com'\n  git config user.name 'Your Name'";
  }
  if (msg.includes("nothing to commit")) {
    return "Nothing to commit, working tree clean";
  }
  if (err.killed || msg.includes("timed out")) {
    throw new Error("Git command timed out");
  }

  throw new Error(`Git error: ${msg || err.message}`);
}