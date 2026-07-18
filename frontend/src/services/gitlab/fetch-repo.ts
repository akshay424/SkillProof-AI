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
const ALLOWED_GITLAB_HOSTS = new Set(["gitlab.com"]);

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

function parseProjectPath(gitlabUrl: string): string {
  const url = new URL(gitlabUrl);
  if (url.protocol !== "https:" || !ALLOWED_GITLAB_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("Use an HTTPS gitlab.com repository URL.");
  }
  const path = url.pathname.replace(/^\/|\.git$|\/$/g, "");
  if (!path) {
    throw new Error("Couldn't parse a project path from that GitLab URL.");
  }
  return path;
}

async function gitlabFetch(host: string, path: string, token?: string): Promise<Response> {
  const response = await fetch(`https://${host}/api/v4${path}`, {
    headers: token ? { "PRIVATE-TOKEN": token } : {},
  });
  if (!response.ok) {
    throw new Error(
      `GitLab API request failed (${response.status}). Check the repo URL${token ? "" : " or add a GitLab token in Profile Settings if this is a private repo"}.`,
    );
  }
  return response;
}

export async function fetchRepoFiles(gitlabUrl: string, token?: string): Promise<RepoFile[]> {
  if (DEMO_MODE) {
    return DEMO_FILES;
  }

  const host = new URL(gitlabUrl).host;
  const projectPath = encodeURIComponent(parseProjectPath(gitlabUrl));

  const projectResponse = await gitlabFetch(host, `/projects/${projectPath}`, token);
  const project = (await projectResponse.json()) as { default_branch: string };

  const treeResponse = await gitlabFetch(
    host,
    `/projects/${projectPath}/repository/tree?recursive=true&per_page=100&ref=${project.default_branch}`,
    token,
  );
  const tree = (await treeResponse.json()) as { path: string; type: string }[];

  const codeFiles = tree
    .filter((entry) => entry.type === "blob" && CODE_EXTENSIONS.some((ext) => entry.path.endsWith(ext)))
    .slice(0, MAX_FILES);

  if (codeFiles.length === 0) {
    throw new Error("No recognized source files found in this repository.");
  }

  const files = await Promise.all(
    codeFiles.map(async (entry) => {
      const fileResponse = await gitlabFetch(
        host,
        `/projects/${projectPath}/repository/files/${encodeURIComponent(entry.path)}/raw?ref=${project.default_branch}`,
        token,
      );
      const content = await fileResponse.text();
      return { path: entry.path, content: content.slice(0, MAX_CHARS_PER_FILE) };
    }),
  );

  return files;
}
