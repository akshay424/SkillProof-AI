import { gitlabFetchJson } from "@/services/gitlab/gitlab-client";
import { DEMO_MODE } from "@/utils/demo-mode";

const MAX_COMMITS = 20;
const MAX_DIFF_CHARS = 8000;
const ALLOWED_REPOSITORY_HOSTS = new Set(["gitlab.com", "github.com", "bitbucket.org"]);

export interface CommitEvidence {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  authored_date: string;
}

export type BuildStatus = "passed" | "failed" | "blocked" | "unknown";

export interface WorkEvidence {
  repository: string;
  branch: string;
  baseCommit: string | null;
  headCommit: string | null;
  commits: CommitEvidence[];
  diff: string;
  filesChanged: string[];
  buildStatus: BuildStatus;
  testsPassed: number | null;
  testsFailed: number | null;
  reviewComments: string[];
}

type RepositoryLocation =
  | { provider: "gitlab"; host: string; projectPath: string }
  | { provider: "github"; owner: string; repository: string }
  | { provider: "bitbucket"; workspace: string; repository: string };

function parseRepositoryUrl(repositoryUrl: string): RepositoryLocation {
  const url = new URL(repositoryUrl);
  const host = url.hostname.toLowerCase();
  const path = url.pathname.replace(/^\/|\.git$|\/$/g, "");
  if (url.protocol !== "https:" || !ALLOWED_REPOSITORY_HOSTS.has(host) || !path) {
    throw new Error("Use a complete HTTPS GitHub, GitLab, or Bitbucket repository URL.");
  }
  if (host === "gitlab.com") return { provider: "gitlab", host, projectPath: path };

  const [owner, repository, ...rest] = path.split("/");
  if (!owner || !repository || rest.length > 0) {
    throw new Error("Use a complete project URL, for example https://github.com/owner/repository.");
  }
  return host === "github.com"
    ? { provider: "github", owner, repository }
    : { provider: "bitbucket", workspace: owner, repository };
}

function truncateDiff(diff: string): string {
  return diff.length > MAX_DIFF_CHARS ? `${diff.slice(0, MAX_DIFF_CHARS)}\n... (truncated)` : diff;
}

const DEMO_EVIDENCE: WorkEvidence = {
  repository: "demo/flutter-login-task",
  branch: "evaluate",
  baseCommit: "a1b2c3d",
  headCommit: "e4f5g6h",
  commits: [
    {
      id: "a1b2c3d4e5f6",
      short_id: "a1b2c3d",
      title: "Add login screen with form validation",
      message: "Add login screen with form validation",
      author_name: "Aarav Patel",
      authored_date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "e4f5g6h7i8j9",
      short_id: "e4f5g6h",
      title: "Handle loading state and error responses",
      message: "Handle loading state and error responses on sign-in",
      author_name: "Aarav Patel",
      authored_date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
  ],
  diff: `--- a/lib/screens/login_screen.dart
+++ b/lib/screens/login_screen.dart
@@ -1,10 +1,28 @@
 class LoginScreen extends StatefulWidget {
   @override
   State<LoginScreen> createState() => _LoginScreenState();
 }

 class _LoginScreenState extends State<LoginScreen> {
   final _formKey = GlobalKey<FormState>();
   bool _isLoading = false;
+  String? _error;

   Future<void> _submit() async {
     if (!_formKey.currentState!.validate()) return;
     setState(() => _isLoading = true);
-    await AuthService().signIn(_email, _password);
-    setState(() => _isLoading = false);
+    try {
+      await AuthService().signIn(_email, _password);
+    } catch (e) {
+      setState(() => _error = 'Invalid email or password');
+    } finally {
+      setState(() => _isLoading = false);
+    }
   }
 }`,
  filesChanged: ["lib/screens/login_screen.dart", "lib/services/auth_service.dart"],
  buildStatus: "passed",
  testsPassed: 3,
  testsFailed: 0,
  reviewComments: [],
};

// ---------- GitLab ----------

interface GitLabCommit { id: string; short_id: string; title: string; message: string; author_name: string; authored_date: string }
interface GitLabDiff { old_path: string; new_path: string; diff: string }
interface GitLabStatus { status: string }
interface GitLabMergeRequest { iid: number }
interface GitLabNote { body: string; system: boolean }

async function fetchGitLabEvidence(loc: Extract<RepositoryLocation, { provider: "gitlab" }>, branch: string, token?: string): Promise<WorkEvidence> {
  const host = loc.host;
  const projectPath = encodeURIComponent(loc.projectPath);

  const commits = await gitlabFetchJson<GitLabCommit[]>(
    host,
    `/projects/${projectPath}/repository/commits?ref_name=${encodeURIComponent(branch)}&per_page=${MAX_COMMITS}`,
    token,
  );
  if (commits.length === 0) throw new Error(`No commits found on branch "${branch}".`);

  const headCommit = commits[0];
  const baseCommit = commits[commits.length - 1];

  const diffsByCommit = await Promise.all(
    commits.map((c) =>
      gitlabFetchJson<GitLabDiff[]>(host, `/projects/${projectPath}/repository/commits/${c.id}/diff`, token).catch(() => [] as GitLabDiff[]),
    ),
  );
  const filesChanged = Array.from(new Set(diffsByCommit.flat().map((d) => d.new_path || d.old_path)));
  const diff = truncateDiff(diffsByCommit.flat().map((d) => `--- a/${d.old_path}\n+++ b/${d.new_path}\n${d.diff}`).join("\n\n"));

  let buildStatus: BuildStatus = "unknown";
  try {
    const statuses = await gitlabFetchJson<GitLabStatus[]>(host, `/projects/${projectPath}/repository/commits/${headCommit.id}/statuses`, token);
    if (statuses.length > 0) {
      const latest = statuses[0].status;
      buildStatus = latest === "success" ? "passed" : latest === "failed" ? "failed" : "blocked";
    }
  } catch { /* no CI configured — leave unknown */ }

  let reviewComments: string[] = [];
  try {
    const mrs = await gitlabFetchJson<GitLabMergeRequest[]>(host, `/projects/${projectPath}/merge_requests?source_branch=${encodeURIComponent(branch)}&state=all`, token);
    if (mrs.length > 0) {
      const notes = await gitlabFetchJson<GitLabNote[]>(host, `/projects/${projectPath}/merge_requests/${mrs[0].iid}/notes`, token);
      reviewComments = notes.filter((n) => !n.system).map((n) => n.body);
    }
  } catch { /* no MR for this branch */ }

  return {
    repository: loc.projectPath,
    branch,
    baseCommit: baseCommit.short_id,
    headCommit: headCommit.short_id,
    commits: commits.map((c) => ({ id: c.id, short_id: c.short_id, title: c.title, message: c.message, author_name: c.author_name, authored_date: c.authored_date })),
    diff,
    filesChanged,
    buildStatus,
    testsPassed: null,
    testsFailed: null,
    reviewComments,
  };
}

// ---------- GitHub ----------

interface GitHubListCommit { sha: string; commit: { message: string; author: { name: string; date: string } } }
interface GitHubCompareFile { filename: string; patch?: string }
interface GitHubCompare { files?: GitHubCompareFile[] }
interface GitHubStatus { state: string }

async function githubJson<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, { headers: { Accept: "application/vnd.github+json" } });
  if (!response.ok) {
    throw new Error(`GitHub API request failed (${response.status}). Check that the repository and branch are public and accessible.`);
  }
  return response.json() as Promise<T>;
}

async function fetchGitHubEvidence(loc: Extract<RepositoryLocation, { provider: "github" }>, branch: string): Promise<WorkEvidence> {
  const repo = `${encodeURIComponent(loc.owner)}/${encodeURIComponent(loc.repository)}`;
  const list = await githubJson<GitHubListCommit[]>(`/repos/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=${MAX_COMMITS}`);
  if (list.length === 0) throw new Error(`No commits found on branch "${branch}".`);

  const headSha = list[0].sha;
  const baseSha = list[list.length - 1].sha;

  let filesChanged: string[] = [];
  let diff = "";
  try {
    const compare = await githubJson<GitHubCompare>(`/repos/${repo}/compare/${baseSha}...${headSha}`);
    const files = compare.files ?? [];
    filesChanged = Array.from(new Set(files.map((f) => f.filename)));
    diff = truncateDiff(files.map((f) => `--- a/${f.filename}\n+++ b/${f.filename}\n${f.patch ?? "(no textual patch)"}`).join("\n\n"));
  } catch { /* compare unavailable (e.g. single commit) — leave diff empty */ }

  let buildStatus: BuildStatus = "unknown";
  try {
    const status = await githubJson<GitHubStatus>(`/repos/${repo}/commits/${headSha}/status`);
    buildStatus = status.state === "success" ? "passed" : status.state === "failure" ? "failed" : status.state === "pending" ? "blocked" : "unknown";
  } catch { /* no status API data */ }

  return {
    repository: `${loc.owner}/${loc.repository}`,
    branch,
    baseCommit: baseSha.slice(0, 7),
    headCommit: headSha.slice(0, 7),
    commits: list.map((c) => ({
      id: c.sha,
      short_id: c.sha.slice(0, 7),
      title: c.commit.message.split("\n")[0],
      message: c.commit.message,
      author_name: c.commit.author?.name ?? "unknown",
      authored_date: c.commit.author?.date ?? "",
    })),
    diff,
    filesChanged,
    buildStatus,
    testsPassed: null,
    testsFailed: null,
    reviewComments: [],
  };
}

// ---------- Bitbucket ----------

interface BitbucketCommit { hash: string; message: string; date: string; author?: { raw?: string; user?: { display_name?: string } } }
interface BitbucketCommitsPage { values?: BitbucketCommit[] }
interface BitbucketDiffstatEntry { new?: { path?: string }; old?: { path?: string } }
interface BitbucketDiffstatPage { values?: BitbucketDiffstatEntry[] }

async function bitbucketJson<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.bitbucket.org/2.0${path}`);
  if (!response.ok) {
    throw new Error(`Bitbucket API request failed (${response.status}). Check that the repository and branch are public and accessible.`);
  }
  return response.json() as Promise<T>;
}

async function bitbucketText(path: string): Promise<string> {
  const response = await fetch(`https://api.bitbucket.org/2.0${path}`);
  if (!response.ok) throw new Error(`Bitbucket API request failed (${response.status}).`);
  return response.text();
}

async function fetchBitbucketEvidence(loc: Extract<RepositoryLocation, { provider: "bitbucket" }>, branch: string): Promise<WorkEvidence> {
  const repo = `${encodeURIComponent(loc.workspace)}/${encodeURIComponent(loc.repository)}`;
  const page = await bitbucketJson<BitbucketCommitsPage>(`/repositories/${repo}/commits/${encodeURIComponent(branch)}?pagelen=${MAX_COMMITS}`);
  const commits = page.values ?? [];
  if (commits.length === 0) throw new Error(`No commits found on branch "${branch}".`);

  const headHash = commits[0].hash;
  const baseHash = commits[commits.length - 1].hash;

  let filesChanged: string[] = [];
  try {
    const diffstat = await bitbucketJson<BitbucketDiffstatPage>(`/repositories/${repo}/diffstat/${headHash}`);
    filesChanged = Array.from(new Set((diffstat.values ?? []).map((e) => e.new?.path ?? e.old?.path).filter((p): p is string => !!p)));
  } catch { /* diffstat unavailable */ }

  let diff = "";
  try {
    diff = truncateDiff(await bitbucketText(`/repositories/${repo}/diff/${headHash}`));
  } catch { /* diff unavailable */ }

  return {
    repository: `${loc.workspace}/${loc.repository}`,
    branch,
    baseCommit: baseHash.slice(0, 7),
    headCommit: headHash.slice(0, 7),
    commits: commits.map((c) => ({
      id: c.hash,
      short_id: c.hash.slice(0, 7),
      title: c.message.split("\n")[0],
      message: c.message,
      author_name: c.author?.user?.display_name ?? c.author?.raw ?? "unknown",
      authored_date: c.date,
    })),
    diff,
    filesChanged,
    buildStatus: "unknown",
    testsPassed: null,
    testsFailed: null,
    reviewComments: [],
  };
}

/**
 * Fetches sanitized work evidence (commits, combined diff, files changed, and
 * best-effort CI/review signals) for a task submission. Supports GitHub,
 * GitLab, and Bitbucket public repos; a GitLab token enables private GitLab.
 */
export async function fetchWorkEvidence(
  repositoryUrl: string,
  branch: string,
  token?: string,
): Promise<WorkEvidence> {
  if (DEMO_MODE) return DEMO_EVIDENCE;

  const location = parseRepositoryUrl(repositoryUrl);
  if (location.provider === "github") return fetchGitHubEvidence(location, branch);
  if (location.provider === "bitbucket") return fetchBitbucketEvidence(location, branch);
  return fetchGitLabEvidence(location, branch, token);
}
