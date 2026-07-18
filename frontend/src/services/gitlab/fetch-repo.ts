import { DEMO_MODE } from "@/utils/demo-mode";
import type { RepoFile } from "@/services/ai/evaluation-agent";

const CODE_EXTENSIONS = [
  ".dart",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".java",
  ".kt",
  ".swift",
  ".go",
  ".rs",
];
const MAX_FILES = 15;
const MAX_CHARS_PER_FILE = 6000;
const ALLOWED_REPOSITORY_HOSTS = new Set(["gitlab.com", "github.com"]);

type RepositoryLocation =
  | { provider: "gitlab"; host: "gitlab.com"; projectPath: string }
  | { provider: "github"; owner: string; repository: string };

const DEMO_FILES: RepoFile[] = [
  {
    path: "lib/screens/login_screen.dart",
    content: `class LoginScreen extends StatefulWidget {
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    await AuthService().signIn(_email, _password);
    setState(() => _isLoading = false);
  }
}`,
  },
  {
    path: "lib/services/auth_service.dart",
    content: `class AuthService {
  final Dio _dio = Dio();

  Future<void> signIn(String email, String password) async {
    await _dio.post('/login', data: {'email': email, 'password': password});
  }
}`,
  },
];

function parseRepositoryUrl(repositoryUrl: string): RepositoryLocation {
  const url = new URL(repositoryUrl);
  const host = url.hostname.toLowerCase();
  const path = url.pathname.replace(/^\/|\.git$|\/$/g, "");
  if (url.protocol !== "https:" || !ALLOWED_REPOSITORY_HOSTS.has(host) || !path) {
    throw new Error("Use a complete HTTPS github.com or gitlab.com repository URL.");
  }
  if (host === "gitlab.com") return { provider: "gitlab", host, projectPath: path };

  const [owner, repository, ...rest] = path.split("/");
  if (!owner || !repository || rest.length > 0) {
    throw new Error("Use a complete GitHub project URL, for example https://github.com/owner/repository.");
  }
  return { provider: "github", owner, repository };
}

async function gitlabFetch(host: string, path: string, token?: string): Promise<Response> {
  const response = await fetch(`https://${host}/api/v4${path}`, {
    headers: token ? { "PRIVATE-TOKEN": token } : {},
  });
  if (!response.ok) {
    throw new Error(
      `GitLab API request failed (${response.status}). Check that the repository and selected branch are accessible.`,
    );
  }
  return response;
}

async function githubFetch(path: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`https://api.github.com${path}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
  } catch {
    throw new Error("Could not reach GitHub. Check your internet connection and try again.");
  }
  if (!response.ok) {
    throw new Error(`GitHub API request failed (${response.status}). Check that the repository and selected branch are public and accessible.`);
  }
  return response;
}

function isCodeFile(path: string) {
  return CODE_EXTENSIONS.some((extension) => path.toLowerCase().endsWith(extension));
}

async function fetchGitLabRepoFiles(location: Extract<RepositoryLocation, { provider: "gitlab" }>, branch: string, token?: string): Promise<RepoFile[]> {
  const projectPath = encodeURIComponent(location.projectPath);
  const treeResponse = await gitlabFetch(
    location.host,
    `/projects/${projectPath}/repository/tree?recursive=true&per_page=100&ref=${encodeURIComponent(branch)}`,
    token,
  );
  const tree = (await treeResponse.json()) as { path: string; type: string }[];
  const codeFiles = tree.filter((entry) => entry.type === "blob" && isCodeFile(entry.path)).slice(0, MAX_FILES);
  if (codeFiles.length === 0) throw new Error("No recognized source files were found on the selected branch.");

  return Promise.all(codeFiles.map(async (entry) => {
    const response = await gitlabFetch(
      location.host,
      `/projects/${projectPath}/repository/files/${encodeURIComponent(entry.path)}/raw?ref=${encodeURIComponent(branch)}`,
      token,
    );
    return { path: entry.path, content: (await response.text()).slice(0, MAX_CHARS_PER_FILE) };
  }));
}

async function fetchGitHubRepoFiles(location: Extract<RepositoryLocation, { provider: "github" }>, branch: string): Promise<RepoFile[]> {
  const repository = `${encodeURIComponent(location.owner)}/${encodeURIComponent(location.repository)}`;
  const treeResponse = await githubFetch(`/repos/${repository}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  const tree = (await treeResponse.json()) as { tree?: Array<{ path: string; type: string }> };
  const codeFiles = (tree.tree ?? []).filter((entry) => entry.type === "blob" && isCodeFile(entry.path)).slice(0, MAX_FILES);
  if (codeFiles.length === 0) throw new Error("No recognized source files were found on the selected branch.");

  return Promise.all(codeFiles.map(async (entry) => {
    const path = entry.path.split("/").map(encodeURIComponent).join("/");
    const response = await githubFetch(`/repos/${repository}/contents/${path}?ref=${encodeURIComponent(branch)}`);
    const file = (await response.json()) as { content?: string; encoding?: string };
    if (file.encoding !== "base64" || typeof file.content !== "string") {
      throw new Error(`GitHub returned an unreadable file: ${entry.path}.`);
    }
    const content = atob(file.content.replace(/\n/g, ""));
    return { path: entry.path, content: content.slice(0, MAX_CHARS_PER_FILE) };
  }));
}

export async function fetchRepoFiles(repositoryUrl: string, branch = "evaluate", token?: string): Promise<RepoFile[]> {
  if (DEMO_MODE) return DEMO_FILES;
  const location = parseRepositoryUrl(repositoryUrl);
  return location.provider === "github"
    ? fetchGitHubRepoFiles(location, branch)
    : fetchGitLabRepoFiles(location, branch, token);
}
